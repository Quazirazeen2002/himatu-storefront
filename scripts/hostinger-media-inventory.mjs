import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(root, "apps/api/.env"), quiet: true });
dotenv.config({ path: resolve(root, ".env.local"), quiet: true });
dotenv.config({ path: resolve(root, "apps/web/.env.local"), quiet: true });
const destination = resolve(root, "output/hostinger-media");
const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && args[0] !== "--download")) throw new Error("Use no arguments for inventory, or --download to copy referenced public media locally");
if (!process.env.DATABASE_URL || !process.env.SUPABASE_URL) throw new Error("Database and Supabase source configuration required");
const connection = new URL(process.env.DATABASE_URL);
const caPath = process.env.DATABASE_SSL_CA_PATH || "certs/supabase-ca.crt";
let ssl;
if (caPath) {
  const ca = await readFile(resolve(root, "apps/api", caPath), "utf8");
  connection.searchParams.delete("sslmode");
  connection.searchParams.delete("sslrootcert");
  ssl = { ca, rejectUnauthorized: true };
}
const client = new pg.Client({ connectionString: connection.toString(), ssl, connectionTimeoutMillis: 10000, statement_timeout: 30000 });
const allowedOrigin = new URL(process.env.SUPABASE_URL).origin;
const mapping = new Map();
function visit(value) {
  if (Array.isArray(value)) { value.forEach(visit); return; }
  if (value && typeof value === "object") { Object.values(value).forEach(visit); return; }
  if (typeof value !== "string" || !value.startsWith(`${allowedOrigin}/storage/v1/object/public/`)) return;
  const parsed = new URL(value);
  const match = parsed.pathname.match(/^\/storage\/v1\/object\/public\/(product-images|hero-media)\/(.+)$/);
  if (!match || decodeURIComponent(match[2]).split("/").includes("requests")) return;
  const extension = parsed.pathname.split(".").at(-1)?.toLowerCase();
  if (!["jpg","jpeg","png","webp","mp4","webm"].includes(extension)) throw new Error("A referenced public file needs manual media-type review");
  const hash = createHash("sha256").update(value).digest("hex");
  const path = `${match[1] === "hero-media" ? "hero" : "products"}/imported/${hash}.${extension}`;
  mapping.set(value, { source: value, path, target: `https://media.himatu.com/${path}` });
}
try {
  await client.connect();
  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  for (const table of ["ProductImage", "Category", "SiteContent"]) {
    const result = await client.query(`SELECT row_to_json(t) AS data FROM "${table}" t`);
    result.rows.forEach(row => visit(row.data));
  }
  const orders = await client.query('SELECT "productImage" FROM "OrderItem" WHERE "productImage" IS NOT NULL');
  orders.rows.forEach(row => visit(row.productImage));
  await client.query("COMMIT");
} catch {
  await client.query("ROLLBACK").catch(() => {});
  throw new Error("Read-only media inventory failed. Check source connectivity and schema; no source data changed.");
} finally { await client.end(); }
await mkdir(destination, { recursive: true, mode: 0o700 });
const files = [...mapping.values()];
let bytes = 0;
if (args[0] === "--download") {
  for (const file of files) {
    const response = await fetch(file.source, { signal: AbortSignal.timeout(120000), redirect: "error" });
    if (!response.ok) throw new Error(`Source media fetch failed (${response.status}); source files retained`);
    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (!["image/jpeg","image/png","image/webp","video/mp4","video/webm"].includes(contentType)) throw new Error("Unexpected media content type");
    const content = Buffer.from(await response.arrayBuffer());
    const local = resolve(destination, "files", file.path);
    await mkdir(dirname(local), { recursive: true, mode: 0o700 });
    await writeFile(local, content, { mode: 0o600 });
    file.bytes = content.length;
    file.sha256 = createHash("sha256").update(content).digest("hex");
    file.contentType = contentType;
    bytes += content.length;
  }
}
const manifest = { createdAt: new Date().toISOString(), downloaded: args[0] === "--download", databaseModified: false, files };
await writeFile(resolve(destination, args[0] === "--download" ? "download-manifest.json" : "inventory.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ referencedPublicFiles: files.length, downloaded: manifest.downloaded, downloadedBytes: bytes, databaseModified: false }));
