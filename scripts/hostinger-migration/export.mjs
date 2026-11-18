import { open, readFile, mkdir, unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { convertSchema, digest, root, sourcePath } from "./prepare.mjs";

export function assertColumns(model, columns) {
  const expected = model.fields.map((field) => field.name).sort();
  const actual = columns.map((column) => column.column_name).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(`Source schema differs for ${model.name}; reconcile before exporting`);
  }
}

export async function exportApplication({ connectionString, caPath, destination, client: suppliedClient }) {
  if (!connectionString && !suppliedClient) throw new Error("SOURCE_DATABASE_URL is required");
  const source = await readFile(sourcePath, "utf8");
  const { models } = convertSchema(source);
  const client = suppliedClient || new pg.Client({
    connectionString,
    ...(caPath ? { ssl: { ca: await readFile(caPath, "utf8"), rejectUnauthorized: true } } : {}),
    connectionTimeoutMillis: 10000,
    statement_timeout: 60000,
    application_name: "himatu-read-only-migration-export",
  });
  let handle;
  let ownsFile = false;
  let committed = false;
  const counts = {};
  try {
    await client.connect();
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    if (destination) {
      const backupRoot = resolve(root, "output/hostinger-migration/backups");
      destination = resolve(destination);
      if (!destination.startsWith(`${backupRoot}/`)) throw new Error("Backups must be saved under output/hostinger-migration/backups/");
      await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
      // Refuse to overwrite earlier backups; don't expose customer data via stdout.
      handle = await open(destination, "wx", 0o600);
      ownsFile = true;
      await handle.writeFile(`${JSON.stringify({ format: "himatu-application-data-v1", sourceSchemaSha256: digest(source), exportedAt: new Date().toISOString(), excludes: ["auth.users", "storage objects"], models })}\n`);
    }
    for (const model of models) {
      const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1", [model.name]);
      assertColumns(model, columns.rows);
      // Model names come from the checked-in Prisma schema, never user input.
      const table = `public."${model.name}"`;
      if (!handle) {
        const result = await client.query(`SELECT count(*)::text AS count FROM ${table}`);
        counts[model.name] = result.rows[0].count;
        continue;
      }
      await client.query(`DECLARE migration_rows NO SCROLL CURSOR FOR SELECT row_to_json(t)::text AS data FROM ${table} t`);
      let count = 0;
      while (true) {
        const batch = await client.query("FETCH FORWARD 250 FROM migration_rows");
        if (!batch.rows.length) break;
        for (const row of batch.rows) {
          // Preserve JSON nulls, UUIDs, timestamp precision, Unicode and numbers
          // as PostgreSQL serializes them, rather than round-tripping via JS Dates.
          await handle.writeFile(`{"table":${JSON.stringify(model.name)},"row":${row.data}}\n`);
          count++;
        }
      }
      await client.query("CLOSE migration_rows");
      counts[model.name] = String(count);
    }
    await client.query("COMMIT");
    if (handle) { await handle.sync(); await handle.close(); handle = undefined; }
    committed = true;
    return { counts, exported: Boolean(destination), excludes: ["Supabase auth accounts/password hashes", "media files"], productionChanged: false };
  } finally {
    if (!committed) {
      await client.query("ROLLBACK").catch(() => {});
      await handle?.close().catch(() => {});
      if (ownsFile) await unlink(destination).catch(() => {});
    }
    await client.end().catch(() => {});
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("--help")) {
    console.log(`Read-only Supabase application-data inventory/export. No target writes.
Set SOURCE_DATABASE_URL securely in the environment; optional SOURCE_DATABASE_SSL_CA_PATH.
  node scripts/hostinger-migration/export.mjs --inventory
  node scripts/hostinger-migration/export.mjs --export output/hostinger-migration/backups/<unique-name>.ndjson
Application data only: auth accounts and actual media require separate backups.
Exports are private (0600), ignored by Git and never overwritten.`);
  } else if (!(args.length === 1 && args[0] === "--inventory") && !(args.length === 2 && args[0] === "--export")) {
    console.error("Use --inventory or --export <new-backup-path>. See --help.");
    process.exitCode = 1;
  } else {
    try {
      const result = await exportApplication({ connectionString: process.env.SOURCE_DATABASE_URL, caPath: process.env.SOURCE_DATABASE_SSL_CA_PATH, destination: args[0] === "--export" ? args[1] : undefined });
      console.log(JSON.stringify(result, null, 2));
    } catch {
      console.error("Read-only export failed; no source data was changed. Check connection, certificate and schema. Any incomplete backup created by this run was removed.");
      process.exitCode = 1;
    }
  }
}
