import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.resolve(rootDir, "output/hostinger");
const desktopDir = "/Users/quazirazeenjubair/Desktop";

console.log("=== Packaging HIMATU for Hostinger ===");

// 1. Create clean output directories
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// 2. Prepare Next.js standalone assets
const webStandaloneDir = path.resolve(rootDir, "apps/web/.next/standalone/apps/web");
if (fs.existsSync(webStandaloneDir)) {
  console.log("Syncing static assets to standalone build...");
  const publicSrc = path.resolve(rootDir, "apps/web/public");
  const publicDest = path.resolve(webStandaloneDir, "public");
  const staticSrc = path.resolve(rootDir, "apps/web/.next/static");
  const staticDest = path.resolve(webStandaloneDir, ".next/static");

  fs.cpSync(publicSrc, publicDest, { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true });
}

// 3. Package Frontend for Hostinger
console.log("Creating Frontend Hostinger archive...");
const frontendTemp = path.resolve(outputDir, "frontend-pkg");
fs.mkdirSync(frontendTemp, { recursive: true });

// Copy frontend files
const webPkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "apps/web/package.json"), "utf8"));
webPkg.dependencies["@himatu/shared"] = "file:./packages/shared";
fs.writeFileSync(path.resolve(frontendTemp, "package.json"), JSON.stringify(webPkg, null, 2));

fs.cpSync(path.resolve(rootDir, "apps/web/server.js"), path.resolve(frontendTemp, "server.js"));
fs.cpSync(path.resolve(rootDir, "apps/web/next.config.ts"), path.resolve(frontendTemp, "next.config.ts"));
fs.cpSync(path.resolve(rootDir, "apps/web/tsconfig.json"), path.resolve(frontendTemp, "tsconfig.json"));
if (fs.existsSync(path.resolve(rootDir, "apps/web/postcss.config.mjs"))) {
  fs.cpSync(path.resolve(rootDir, "apps/web/postcss.config.mjs"), path.resolve(frontendTemp, "postcss.config.mjs"));
}
fs.cpSync(path.resolve(rootDir, "apps/web/src"), path.resolve(frontendTemp, "src"), { recursive: true });
fs.cpSync(path.resolve(rootDir, "apps/web/public"), path.resolve(frontendTemp, "public"), { recursive: true });
fs.cpSync(path.resolve(rootDir, "apps/web/.next"), path.resolve(frontendTemp, ".next"), { recursive: true });
fs.cpSync(path.resolve(rootDir, "packages/shared"), path.resolve(frontendTemp, "packages/shared"), { recursive: true });

// Add production .env.example
fs.writeFileSync(
  path.resolve(frontendTemp, ".env.example"),
  `# HIMATU Storefront (Frontend) Hostinger Environment Variables
NODE_ENV=production
PORT=3000
APP_URL=https://himatu.com
API_URL=https://api.himatu.com
AUTH_ALLOW_LOCAL_ORIGINS=false
SUPABASE_URL=https://tqwgmmiljcumomhxwxit.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
`
);

const frontendZip = path.resolve(outputDir, "HIMATU-Hostinger-Frontend.zip");
execSync(`cd "${frontendTemp}" && zip -rq "${frontendZip}" . -x ".next/cache/**" -x ".next/dev/**" -x ".next/standalone/**"`);
console.log(`Frontend packaged: ${frontendZip}`);

// 4. Package Backend API for Hostinger
console.log("Creating Backend API Hostinger archive...");
const backendTemp = path.resolve(outputDir, "backend-pkg");
fs.mkdirSync(backendTemp, { recursive: true });

const apiPkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "apps/api/package.json"), "utf8"));
apiPkg.dependencies["@himatu/shared"] = "file:./packages/shared";
fs.writeFileSync(path.resolve(backendTemp, "package.json"), JSON.stringify(apiPkg, null, 2));

fs.cpSync(path.resolve(rootDir, "apps/api/server.js"), path.resolve(backendTemp, "server.js"));
fs.cpSync(path.resolve(rootDir, "apps/api/dist"), path.resolve(backendTemp, "dist"), { recursive: true });
fs.cpSync(path.resolve(rootDir, "apps/api/prisma"), path.resolve(backendTemp, "prisma"), { recursive: true });
fs.cpSync(path.resolve(rootDir, "apps/api/certs"), path.resolve(backendTemp, "certs"), { recursive: true });
if (fs.existsSync(path.resolve(rootDir, "apps/api/store-settings.json"))) {
  fs.cpSync(path.resolve(rootDir, "apps/api/store-settings.json"), path.resolve(backendTemp, "store-settings.json"));
}
fs.cpSync(path.resolve(rootDir, "packages/shared"), path.resolve(backendTemp, "packages/shared"), { recursive: true });

fs.writeFileSync(
  path.resolve(backendTemp, ".env.example"),
  `# HIMATU API (Backend) Hostinger Environment Variables
NODE_ENV=production
PORT=4000
WEB_ORIGIN=https://himatu.com
DATABASE_URL=postgresql://postgres.tqwgmmiljcumomhxwxit:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DATABASE_SSL_CA_PATH=certs/supabase-ca.crt
SUPABASE_URL=https://tqwgmmiljcumomhxwxit.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-service-role-secret-key
SUPABASE_JWT_ISSUER=https://tqwgmmiljcumomhxwxit.supabase.co/auth/v1
`
);

const backendZip = path.resolve(outputDir, "HIMATU-Hostinger-API.zip");
execSync(`cd "${backendTemp}" && zip -rq "${backendZip}" .`);
console.log(`Backend API packaged: ${backendZip}`);

// 5. Package Fullstack Monorepo for Hostinger
console.log("Creating Fullstack Monorepo Hostinger archive...");
const fullstackZip = path.resolve(outputDir, "HIMATU-Hostinger-Fullstack.zip");
execSync(
  `zip -rq "${fullstackZip}" package.json package-lock.json ecosystem.config.cjs README.md docs apps packages scripts -x "**/node_modules/**" -x "**/.git/**" -x "**/output/**" -x "**/.DS_Store" -x "apps/web/.next/cache/**" -x "apps/web/.next/dev/**" -x "apps/web/.next/standalone/**"`,
  { cwd: rootDir }
);
console.log(`Fullstack packaged: ${fullstackZip}`);

// 6. Clean previous zips on Desktop and copy fresh ones
console.log("Cleaning and copying fresh archives to Desktop...");
try {
  execSync(`rm -f "${desktopDir}"/HIMATU-Hostinger-*.zip "${desktopDir}"/Hematu-updated.zip`);
} catch {}

fs.copyFileSync(frontendZip, path.resolve(desktopDir, "HIMATU-Hostinger-Frontend.zip"));
fs.copyFileSync(backendZip, path.resolve(desktopDir, "HIMATU-Hostinger-API.zip"));
fs.copyFileSync(fullstackZip, path.resolve(desktopDir, "HIMATU-Hostinger-Fullstack.zip"));

console.log("=== Hostinger Packaging Complete! ===");
console.log("Files created on Desktop:");
console.log(`- ${path.resolve(desktopDir, "HIMATU-Hostinger-Frontend.zip")}`);
console.log(`- ${path.resolve(desktopDir, "HIMATU-Hostinger-API.zip")}`);
console.log(`- ${path.resolve(desktopDir, "HIMATU-Hostinger-Fullstack.zip")}`);
