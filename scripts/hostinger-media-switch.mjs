import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const folder = resolve(root, "output/hostinger-media");
const specs = [
  { table: "ProductImage", key: "id", fields: ["imageUrl"] },
  { table: "Category", key: "id", fields: ["imageUrl", "bannerImageUrl"] },
  { table: "OrderItem", key: "id", fields: ["productImage"] },
  { table: "SiteContent", key: "key", fields: ["value"], json: true },
  { table: "OrderInvoice", key: "id", fields: ["snapshot"], json: true },
];

export function replaceMedia(value, mapping) {
  if (typeof value === "string") return mapping.get(value) || value;
  if (Array.isArray(value)) return value.map(item => replaceMedia(item, mapping));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,replaceMedia(item,mapping)]));
  return value;
}

export function assertChange(change) {
  const spec = specs.find(item => item.table === change.table && item.key === change.keyColumn && item.fields.includes(change.field));
  if (!spec || Boolean(spec.json) !== Boolean(change.json) || typeof change.key !== "string") throw new Error("Invalid media change");
}

async function connect() {
  for (const name of ["apps/api/.env", ".env.local", "apps/web/.env.local"]) dotenv.config({ path: resolve(root,name), quiet: true });
  if (!process.env.DATABASE_URL) throw new Error("Source database configuration required");
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete("sslmode"); url.searchParams.delete("sslrootcert");
  const ca = await readFile(resolve(root,"apps/api",process.env.DATABASE_SSL_CA_PATH || "certs/supabase-ca.crt"),"utf8");
  const client = new pg.Client({ connectionString: url.toString(), ssl: { ca, rejectUnauthorized: true }, connectionTimeoutMillis:10000, statement_timeout:30000 });
  await client.connect();
  return client;
}

async function inspect(client, mapping) {
  const changes=[];
  for (const spec of specs) {
    const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",[spec.table]);
    const names=new Set(columns.rows.map(row=>row.column_name));
    if (!names.size) throw new Error(`Missing table ${spec.table}`);
    const fields=spec.fields.filter(field=>names.has(field));
    if (!fields.length) throw new Error(`Missing media columns on ${spec.table}`);
    const result=await client.query(`SELECT "${spec.key}", ${fields.map(field=>`"${field}"`).join(",")} FROM "${spec.table}"`);
    for (const row of result.rows) for (const field of fields) {
      const before=row[field], after=replaceMedia(before,mapping);
      if (JSON.stringify(before)!==JSON.stringify(after)) changes.push({table:spec.table,keyColumn:spec.key,key:row[spec.key],field,json:Boolean(spec.json),before,after});
    }
  }
  return changes;
}

async function update(client, changes, rollback=false) {
  for (const change of changes) {
    assertChange(change);
    const before=rollback?change.after:change.before, after=rollback?change.before:change.after;
    const cast=change.json?"::jsonb":"";
    const result=await client.query(`UPDATE "${change.table}" SET "${change.field}"=$1${cast} WHERE "${change.keyColumn}"=$2 AND "${change.field}" IS NOT DISTINCT FROM $3${cast}`,[change.json?JSON.stringify(after):after,change.key,change.json?JSON.stringify(before):before]);
    if(result.rowCount!==1) throw new Error("Concurrent media edit detected; transaction must be rolled back");
  }
}

export async function run(mode, backupName) {
  if (!["--plan","--apply","--rollback"].includes(mode)) throw new Error("Use --plan, --apply, or --rollback <backup-path>");
  let client;
  let transaction=false;
  try {
    let changes;
    if(mode==="--rollback") {
      const path=resolve(backupName || "");
      if(!path.startsWith(`${resolve(folder,"backups")}/`))throw new Error("Use a backup under output/hostinger-media/backups");
      const backup=JSON.parse(await readFile(path,"utf8"));
      if(backup.format!=="himatu-media-url-backup-v1")throw new Error("Invalid backup");
      changes=backup.changes;
      changes.forEach(assertChange);
    } else {
      const manifest=JSON.parse(await readFile(resolve(folder,"download-manifest.json"),"utf8"));
      const verification=JSON.parse(await readFile(resolve(folder,"http-verification.json"),"utf8"));
      if(!manifest.downloaded || verification.failed!==0 || verification.imagesDecoded+verification.videosWithRangeSupport!==manifest.files.length)throw new Error("Verified media copies are required");
      const mapping=new Map();
      const sourceOrigin=new URL((await import("dotenv")).parse(await readFile(resolve(root,"apps/web/.env.local"))).SUPABASE_URL).origin;
      for(const file of manifest.files) {
        if(!file.source.startsWith(`${sourceOrigin}/storage/v1/object/public/`) || !/^https:\/\/media\.himatu\.com\/(products|hero)\/imported\/[0-9a-f]{64}\.(jpg|jpeg|png|webp|mp4|webm)$/.test(file.target) || !file.sha256)throw new Error("Invalid migration mapping");
        mapping.set(file.source,file.target);
      }
      // Check fresh delivery, since the saved verification is only a past result.
      let next=0;
      await Promise.all(Array.from({length:4},async()=>{while(next<manifest.files.length){const file=manifest.files[next++];const response=await fetch(file.target,{method:"HEAD",signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error("A media copy is unavailable; no URLs were changed");}}));
      client=await connect();
      await client.query(mode==="--plan"?"BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY":"BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      transaction=true;
      changes=await inspect(client,mapping);
      if(mode==="--apply" && changes.length) {
        await mkdir(resolve(folder,"backups"),{recursive:true,mode:0o700});
        backupName=resolve(folder,"backups",`media-urls-${Date.now()}.json`);
        await writeFile(backupName,JSON.stringify({format:"himatu-media-url-backup-v1",createdAt:new Date().toISOString(),changes},null,2),{flag:"wx",mode:0o600});
      }
    }
    if(mode==="--rollback") {client=await connect();await client.query("BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE");transaction=true;}
    if(mode!=="--plan")await update(client,changes,mode==="--rollback");
    await client.query("COMMIT");transaction=false;
    const counts={};for(const change of changes)counts[change.table]=(counts[change.table]||0)+1;
    return {mode,changedCells:changes.length,byTable:counts,backup:backupName||null,databaseModified:mode!=="--plan"&&changes.length>0};
  } finally {
    if(transaction)await client.query("ROLLBACK").catch(()=>{});
    await client?.end().catch(()=>{});
  }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {console.log(JSON.stringify(await run(process.argv[2]||"--plan",process.argv[3]),null,2));}
  catch {console.error("Media URL operation failed. Any uncommitted changes were rolled back. No source files were deleted. Check configuration, delivery, schema and concurrent edits before retrying.");process.exitCode=1;}
}
