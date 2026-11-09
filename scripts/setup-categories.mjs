import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import dotenv from "dotenv";
import { Pool } from "pg";
const require = createRequire(import.meta.url);
const { storefrontTaxonomy } = require("@himatu/shared");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (!process.argv.includes("--apply")) {
  console.log(JSON.stringify({ mode:"dry-run", categories:storefrontTaxonomy.map(({name,kind,family})=>({name,kind,family})), note:"Use --apply to update these category defaults; prices, stock and existing franchise assignments are preserved." },null,2));
  process.exit(0);
}
const env = dotenv.parse(fs.readFileSync(path.join(root,"apps/api/.env")));
const url = new URL(env.DIRECT_URL || env.DATABASE_URL);
url.searchParams.delete("sslmode"); url.searchParams.delete("sslrootcert");
const pool = new Pool({ connectionString:url.toString(), max:1, connectionTimeoutMillis:10000, ssl:{ca:fs.readFileSync(path.join(root,"apps/api/certs/supabase-ca.crt"),"utf8"),rejectUnauthorized:true} });
let client;
try {
  client = await pool.connect(); await client.query("BEGIN");
  const beforeCategories = (await client.query('SELECT * FROM "Category" ORDER BY slug FOR UPDATE')).rows;
  const beforeProducts = (await client.query('SELECT id, price, "salePrice", "categoryId" FROM "Product" ORDER BY id FOR UPDATE')).rows;
  const beforeInventory = (await client.query('SELECT id, quantity, "reservedQuantity" FROM "Inventory" ORDER BY id')).rows;
  const dir=path.join(root,"output/category-backups");fs.mkdirSync(dir,{recursive:true});
  const backup=path.join(dir,`before-taxonomy-${Date.now()}.json`);
  fs.writeFileSync(backup,JSON.stringify({categories:beforeCategories,products:beforeProducts,inventory:beforeInventory},null,2),{flag:"wx",mode:0o600});
  const ids = new Map();
  for (const category of storefrontTaxonomy) {
    const result = await client.query(`INSERT INTO "Category" (id,name,slug,description,"imageUrl","kind",family,"imageIsDemo","isActive","displayOrder","updatedAt")
      VALUES (gen_random_uuid(),$1,$2,$3,$4,$5::"CategoryKind",$6::"FranchiseFamily",$7,true,$8,NOW())
      ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,"imageUrl"=EXCLUDED."imageUrl",kind=EXCLUDED.kind,family=EXCLUDED.family,"imageIsDemo"=EXCLUDED."imageIsDemo","displayOrder"=EXCLUDED."displayOrder","updatedAt"=NOW()
      RETURNING id,slug`,[category.name,category.slug,category.description,category.imageUrl,category.kind,category.family,category.imageIsDemo,category.displayOrder]);
    ids.set(result.rows[0].slug,result.rows[0].id);
  }
  await client.query('UPDATE "Product" SET "productTypeId"=CASE WHEN slug=$1 THEN $2::uuid ELSE $3::uuid END WHERE "productTypeId" IS NULL',["collector-pin",ids.get("accessories"),ids.get("action-figures")]);
  const afterProducts=(await client.query('SELECT id,price,"salePrice","categoryId" FROM "Product" ORDER BY id')).rows;
  const afterInventory=(await client.query('SELECT id,quantity,"reservedQuantity" FROM "Inventory" ORDER BY id')).rows;
  if (JSON.stringify(beforeProducts)!==JSON.stringify(afterProducts)||JSON.stringify(beforeInventory)!==JSON.stringify(afterInventory)) throw new Error("Preservation check failed");
  await client.query("COMMIT");
  console.log(JSON.stringify({configured:storefrontTaxonomy.length,productCategories:5,animeFranchises:11,originalPricesStockAndFranchisesPreserved:true,backup:path.relative(root,backup)}));
} catch(error) {if(client)await client.query("ROLLBACK");console.error("Category setup failed:",error.code || error.name);process.exitCode=1;}
finally {client?.release();await pool.end();}
