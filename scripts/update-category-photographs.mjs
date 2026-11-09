import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import { Pool } from 'pg';
const require = createRequire(import.meta.url);
const { storefrontTaxonomy } = require('@himatu/shared');
const root = path.resolve(import.meta.dirname, '..');
const changes = storefrontTaxonomy.filter(c => c.imageUrl?.startsWith('/images/sourced/'));
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({mode:'dry-run',covers:changes.map(c=>({slug:c.slug,imageUrl:c.imageUrl}))},null,2));
  process.exit(0);
}
const env=dotenv.parse(fs.readFileSync(path.join(root,'apps/api/.env')));
const url=new URL(env.DIRECT_URL || env.DATABASE_URL);url.searchParams.delete('sslmode');url.searchParams.delete('sslrootcert');
const pool=new Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:10000,ssl:{ca:fs.readFileSync(path.join(root,'apps/api/certs/supabase-ca.crt'),'utf8'),rejectUnauthorized:true}});
const client=await pool.connect();
try {
  await client.query('BEGIN');
  const before=(await client.query('SELECT id,slug,"imageUrl","imageIsDemo" FROM "Category" ORDER BY slug FOR UPDATE')).rows;
  const dir=path.join(root,'output/category-backups');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,`before-original-photos-${Date.now()}.json`),JSON.stringify(before,null,2),{flag:'wx',mode:0o600});
  let updated=0;
  for(const c of changes){
    // Only replace our previous generated template covers. Preserve later admin uploads.
    const result=await client.query('UPDATE "Category" SET "imageUrl"=$1,"imageIsDemo"=false,"updatedAt"=NOW() WHERE slug=$2 AND "imageUrl"=$3',[c.imageUrl,c.slug,`/images/categories/${c.slug}.webp`]);
    updated+=result.rowCount;
  }
  await client.query('COMMIT');console.log(JSON.stringify({updated,productPricesAndInventoryUntouched:true}));
} catch(error) {await client.query('ROLLBACK');console.error('Cover update failed:',error.code || error.name);process.exitCode=1;}
finally {client.release();await pool.end();}
