import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const sourcePath = resolve(root, "apps/api/prisma/schema.prisma");
export const digest = (value) => createHash("sha256").update(value).digest("hex");

// Keep the production schema and PostgreSQL migration history intact. This
// produces a separate MySQL baseline, never a migration against the live DB.
export function convertSchema(source) {
  if (!/provider\s*=\s*"postgresql"/.test(source)) {
    throw new Error("Expected the existing PostgreSQL schema");
  }
  if (/@@?map\s*\(|\b(?:BigInt|Decimal|Bytes|Unsupported)\b/.test(source)) {
    throw new Error("New schema types or mappings require migration review");
  }
  const scalarTypes = new Set(["String", "Int", "Boolean", "DateTime", "Json"]);
  const enums = [...source.matchAll(/^enum (\w+)\s*\{/gm)].map((match) => match[1]);
  const enumTypes = new Set(enums);
  const models = [];
  for (const match of source.matchAll(/^model (\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const fields = [];
    for (const line of match[2].split("\n")) {
      const field = line.trim().match(/^(\w+)\s+(\w+)(\?|\[\])?(?:\s|$)/);
      if (!field || (!scalarTypes.has(field[2]) && !enumTypes.has(field[2]))) continue;
      if (field[3] === "[]") throw new Error("Scalar arrays need explicit conversion");
      fields.push({ name: field[1], type: field[2], nullable: field[3] === "?" });
    }
    models.push({ name: match[1], fields });
  }
  if (models.length === 0) throw new Error("No application models found");
  const schema = source
    .replace(/provider\s*=\s*"postgresql"/, 'provider = "mysql"')
    .replace(/output\s*=\s*"[^"]+"/, 'output       = "./generated/client"')
    .replace(/@db\.Uuid\b/g, "@db.Char(36)")
    .split("\n")
    .map((line) => {
      // PostgreSQL's unbounded String is TEXT. MySQL's default is VARCHAR(191),
      // which would truncate descriptions, URLs, notes and storage paths.
      if (/^\s+\w+\s+String\??(?:\s|$)/.test(line) && !line.includes("@db.")) {
        if (/@(?:id|unique)\b/.test(line)) {
          throw new Error("An indexed unbounded string requires an explicit length");
        }
        return `${line} @db.LongText`;
      }
      return line;
    })
    .join("\n");
  return { schema, models };
}

export function prepare(destination = resolve(root, "output/hostinger-migration")) {
  const source = readFileSync(sourcePath, "utf8");
  const { schema, models } = convertSchema(source);
  const output = resolve(destination);
  if (output === dirname(sourcePath) || !output.startsWith(`${resolve(root, "output")}/`)) {
    throw new Error("Migration preparation must write to a subdirectory of output/");
  }
  mkdirSync(resolve(output, "migrations/0001_initial"), { recursive: true });
  writeFileSync(resolve(output, "schema.prisma"), schema);
  writeFileSync(resolve(output, "prisma.config.ts"), `import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "./schema.prisma",
  migrations: { path: "./migrations" },
  datasource: { url: process.env.HOSTINGER_DATABASE_URL || "mysql://unconfigured:unconfigured@127.0.0.1:3306/unconfigured" },
});
`);
  writeFileSync(resolve(output, "migrations/migration_lock.toml"), 'provider = "mysql"\n');
  const cli = resolve(root, "node_modules/prisma/build/index.js");
  const config = resolve(output, "prisma.config.ts");
  for (const args of [
    ["validate", "--config", config],
    ["migrate", "diff", "--config", config, "--from-empty", "--to-schema", resolve(output, "schema.prisma"), "--script", "--output", resolve(output, "migrations/0001_initial/migration.sql")],
  ]) {
    execFileSync(process.execPath, [cli, ...args], { cwd: root, stdio: "pipe" });
  }
  const manifest = {
    format: "himatu-hostinger-migration-v1",
    sourceSchemaSha256: digest(source),
    mysqlSchemaSha256: digest(schema),
    models,
    readyForProduction: false,
    pending: [
      "Create a separate empty Hostinger MySQL database and verify connectivity",
      "Back up and transfer application data, auth users and storage objects",
      "Replace PostgreSQL runtime adapter, searches and storefront SQL fallback",
      "Replace Supabase Auth, verify sessions, email verification and password recovery",
      "Confirm persistent Hostinger media storage and replace signed upload/download flows",
      "Test both applications on staging, then arrange a write freeze and final data sync",
      "Verify rollback before switching production; retain Supabase data",
    ],
  };
  writeFileSync(resolve(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return { output, tables: models.length, sourceSchemaSha256: manifest.sourceSchemaSha256, readyForProduction: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--help")) {
    console.log("node scripts/hostinger-migration/prepare.mjs\nGenerates and validates an isolated MySQL baseline in output/hostinger-migration.\nNever connects to a database or changes the active application configuration.");
  } else {
    try { console.log(JSON.stringify(prepare(), null, 2)); }
    catch (error) {
      console.error("MySQL preparation failed. Review schema compatibility; no database was modified.");
      // Prisma validation output has no connection values; don't print the error
      // object or inherited environment, which may contain production secrets.
      if (error.stderr) console.error(String(error.stderr).replace(/(?:mysql|postgres(?:ql)?):\/\/[^\s]+/g, "[connection redacted]"));
      process.exitCode = 1;
    }
  }
}
