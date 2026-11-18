import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, access, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { convertSchema, root, sourcePath } from "./prepare.mjs";
import { assertColumns, exportApplication } from "./export.mjs";

const source = await readFile(sourcePath, "utf8");
const { models } = convertSchema(source);

function sourceClient({ failAt, row = { id: "an-id", description: "বাংলা · 日本語", metadata: { missing: null }, createdAt: "2026-11-17T00:01:02.123" } } = {}) {
  let current;
  let fetched = false;
  const queries = [];
  return {
    queries,
    async connect() {},
    async end() {},
    async query(sql, values) {
      queries.push(sql);
      if (sql.startsWith("SELECT column_name")) {
        current = models.find((model) => model.name === values[0]);
        if (current.name === failAt) throw new Error("Injected database interruption");
        return { rows: current.fields.map((field) => ({ column_name: field.name })) };
      }
      if (sql.startsWith("SELECT count")) return { rows: [{ count: "1" }] };
      if (sql.startsWith("DECLARE")) { fetched = false; return { rows: [] }; }
      if (sql.startsWith("FETCH")) {
        if (fetched) return { rows: [] };
        fetched = true;
        return { rows: [{ data: JSON.stringify(row) }] };
      }
      return { rows: [] };
    },
  };
}

test("MySQL conversion retains IDs, enums, JSON, explicit lengths and unlimited text", () => {
  const { schema } = convertSchema(source);
  assert.match(schema, /provider = "mysql"/);
  assert.doesNotMatch(schema, /@db\.Uuid/);
  assert.match(schema, /supabaseUserId\s+String\s+@unique @db.Char\(36\)/);
  assert.match(schema, /description\s+String\s+@db.LongText/);
  assert.match(schema, /imageUrl\s+String\??\s+@db.LongText/);
  assert.match(schema, /snapshot Json/);
  assert.match(schema, /email\s+String\s+@db.VarChar\(254\)/);
  assert.equal(models.length, 25);
  assert.throws(() => convertSchema(source.replace("description      String", "description      String[]")), /arrays/);
  assert.throws(() => convertSchema(`${source}\n// Decimal`), /review/);
});

test("schema drift aborts export rather than silently skipping columns", () => {
  assert.throws(() => assertColumns(models[0], [{ column_name: "id" }]), /differs/);
});

test("inventory is a consistent read-only transaction and reports counts only", async () => {
  const client = sourceClient();
  const result = await exportApplication({ client });
  assert.equal(Object.keys(result.counts).length, 25);
  assert.equal(result.exported, false);
  assert.match(client.queries[0], /REPEATABLE READ READ ONLY/);
  assert.equal(client.queries.at(-1), "COMMIT");
  assert.ok(client.queries.every((sql) => /^(BEGIN|SET LOCAL|SELECT|COMMIT)/.test(sql)));
  assert.equal(JSON.stringify(result).includes("an-id"), false);
});

test("export preserves serialized values, restricts file permissions and refuses overwrites", async () => {
  const folder = resolve(root, "output/hostinger-migration/backups");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(folder, { recursive: true });
  const directory = await mkdtemp(resolve(folder, "test-"));
  const destination = resolve(directory, "data.ndjson");
  try {
    const result = await exportApplication({ client: sourceClient(), destination });
    assert.equal(result.counts.UserProfile, "1");
    const contents = await readFile(destination, "utf8");
    const lines = contents.trim().split("\n").map(JSON.parse);
    assert.equal(lines.length, 26);
    assert.equal(lines[1].row.description, "বাংলা · 日本語");
    assert.deepEqual(lines[1].row.metadata, { missing: null });
    assert.equal(lines[1].row.createdAt, "2026-11-17T00:01:02.123");
    assert.equal((await stat(destination)).mode & 0o777, 0o600);
    await assert.rejects(exportApplication({ client: sourceClient(), destination }), /EEXIST/);
    assert.equal(await readFile(destination, "utf8"), contents);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("interrupted export rolls back and removes its incomplete backup", async () => {
  const destination = resolve(root, `output/hostinger-migration/backups/test-interrupted-${process.pid}.ndjson`);
  const client = sourceClient({ failAt: models[1].name });
  await assert.rejects(exportApplication({ client, destination }), /interruption/);
  await assert.rejects(access(destination));
  assert.equal(client.queries.at(-1), "ROLLBACK");
});

test("export refuses paths outside the ignored private backup directory", async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), "himatu-backup-test-"));
  const destination = resolve(temporary, "keep.txt");
  await writeFile(destination, "existing-file");
  try {
    await assert.rejects(exportApplication({ client: sourceClient(), destination }), /Backups must/);
    assert.equal(await readFile(destination, "utf8"), "existing-file");
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
