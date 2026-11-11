# HIMATU deployment on Hostinger

## Corrected storefront upload

Use `output/hostinger/HIMATU-Hostinger-Frontend-Fixed.zip` for the storefront. This is a deployment-only transformation of the existing frontend, not a new application or a replacement for the monorepo's source layout.

Settings:

- Framework: Next.js
- Node: 22.x (22.12 or newer)
- Root directory: `./`
- Package manager: npm
- Build command: `npm run build`
- Output directory: `.next`

The output directory is now `.next`, replacing the old `apps/web/.next` setting. Keep the five production frontend environment variables configured in Hostinger: APP_URL, API_URL, AUTH_ALLOW_LOCAL_ORIGINS, SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. The archive contains no environment files. Existing Supabase/backend values must be entered through the hosting dashboard.

## Runtime failure and correction

The supplied Hostinger build log showed successful compilation, publishing and a reported restart. The runtime log then showed `Cannot find module 'next'` from the published `nodejs/server.js`. Build success alone had not established that the published dependency layout would run.

The corrected archive places the Next.js frontend package, source and public assets at the archive root. Next.js is a direct production dependency there. The shared package is retained inside `packages/shared`; the API application and its dependencies are excluded from this frontend upload. Runtime dependency versions match the original lockfile.

`next.config.mjs` enables standalone output with the flattened app as its tracing root. The build script builds the shared package, builds Next.js and runs `scripts/prepare-standalone.cjs`. That script verifies the generated server resolves Next.js from within the standalone directory and includes public images and static assets.

## Validation

Validated a clean dependency installation and production build. Copied only `.next/standalone` into a separate temporary directory, verified its links did not escape that directory, and started `server.js` with NODE_PATH removed. The isolated server resolved `node_modules/next/package.json` locally and served sign-in, account creation, a static build asset, an original HIMATU photograph, a sourced photograph and an optimized photograph with HTTP 200. Production authentication code was preserved; these checks did not create accounts or certify backend connectivity.

The artifact manifest is `output/hostinger/frontend-fixed-validation.json`. The application source files were verified unchanged. This is local runtime verification, not confirmation that Hostinger has deployed the corrected archive. Recheck Hostinger runtime logs after uploading it.

## Remaining deployment

The NestJS API still needs its own deployment and production configuration at `api.himatu.com`. The flattened frontend archive is not the API upload. Email delivery and production customer flows must be verified after backend configuration. Rebuild the upload from current frontend/shared sources after subsequent code changes; do not assume an older ZIP contains later repository edits.

## API upload

Use `output/hostinger/HIMATU-Hostinger-API.zip` for a second Node.js Web App at `api.himatu.com`.

- Framework: NestJS, or Other if NestJS is not offered
- Node: 22.x (22.12 or newer)
- Root directory: `./`
- Package manager: npm
- Build command: `npm run build`
- Output directory: `dist`
- Entry file, when requested: `server.js`

The source root contains `server.js` loading `dist/main.js`. The published `dist` also contains its own `server.js`, compiled API and Prisma client, production node_modules with dereferenced shared-package dependencies, and public database CA certificate. The build installs development build dependencies explicitly before compiling and removes them before constructing the runtime. No database migration or seed runs automatically. Dependency versions are pinned to the existing repository lockfile.

Configure NODE_ENV=production, WEB_ORIGIN=https://himatu.com and DATABASE_SSL_CA_PATH=certs/supabase-ca.crt. Copy the existing private values for DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY and SUPABASE_JWT_ISSUER into the API app's environment settings. Keep Hostinger's managed PORT configuration. No local `.env`, database URL, key or SMTP password is included in the ZIP. SMTP remains pending as previously requested.

Validation: clean package build passed, production dependencies resolved inside an isolated copy of only the output directory, generated Prisma client and CA were present, and the server started in production mode. With configuration read securely from the local API environment, read-only checks returned health 200 with database up, categories 200 (20 records), a product read 200, and an unauthenticated admin request 401. No user, order, payment or database changes were made. This is local packaged-runtime validation; the Hostinger API deployment still needs verification.

After deployment, check `https://api.himatu.com/api/v1/health`. The expected response is `{ "status": "ok", "database": "up" }`. The API's root path may return 404; use the health endpoint for readiness. Verify the storefront's existing API_URL is `https://api.himatu.com`, then check authentication and Supabase production callback URLs.
