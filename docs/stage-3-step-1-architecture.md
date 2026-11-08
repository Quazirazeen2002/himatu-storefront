# Stage 3 Step 1 architecture and migration plan

## Inspection

The starting repository is one Next.js 16 / React 19 application using npm and a single package-lock.json. Source is in src/, photographs in public/, local licensed fonts in src/app/fonts/, and documentation/reference/screenshot assets at the root. Auth is an unconnected client adapter. Commerce remains local browser state with validated fixture IDs. No database, backend or environment configuration was present.

## Migration plan (recorded before relocation)

Move the existing src/, public/, package manifest, tsconfig, Next environment types, ESLint and PostCSS configuration into apps/web without duplicating application code. Preserve relative source imports and asset URLs. Keep docs/, design-references/ and output/ at the repository root. Keep one npm lockfile and establish npm workspaces for apps/web, apps/api and packages/shared. Root build/typecheck/lint/test scripts orchestrate the packages in dependency order. Record photo hashes before relocation and verify them afterwards. No product/inventory fixture will be seeded into the real database.

Add NestJS API modules for configuration, health, database access, JWT verification and customer profiles. Prisma uses pooled runtime connections and a separate migration URL. Next.js acts as a same-origin backend-for-frontend: HTTP-only Supabase session cookies stay on the web server, state-changing requests require same-origin CSRF checks, and API proxy requests forward the access token to NestJS. Nest verifies the token signature/claims and derives application roles from its database, never browser role fields.

External project provisioning and live tests require authorized Supabase access. Unconfigured services must fail closed and report configuration status honestly. A local build or mocked JWT test is not evidence of live Supabase or Vercel deployment readiness.

## Resulting request lifecycle

1. Next.js renders the existing storefront. Customer forms POST only to same-origin `/api/auth/*` handlers.
2. The web server checks Origin and a custom request header, validates shared Zod input, and calls Supabase Auth. Access/refresh tokens are held in HTTP-only, Secure (production), SameSite=Lax cookies. Passwords are not persisted.
3. The account session endpoint verifies the Supabase identity with getUser(), refreshes cookies in a writable Route Handler, then forwards the access token server-to-server to NestJS.
4. Nest's AuthGuard verifies JWT signatures through the project's JWKS, validates issuer/audience/expiry/UUID subject/customer claims, and idempotently creates or synchronizes the UserProfile through Prisma.
5. Application roles come from PostgreSQL. User-editable metadata cannot set ADMIN. PATCH /users/me derives its owner from the verified request and accepts only name/phone.
6. Next returns only the customer profile, never access/refresh tokens, to browser code.

## Modules

`AppModule` connects ConfigModule, PrismaModule, HealthModule, AuthModule and UsersModule. Controllers receive HTTP requests; injectable services perform work; guards decide whether a request is authenticated/authorized. This is analogous to Python route handlers calling application services and authentication dependencies. `createApplication()` centralizes validation, CORS, security headers, JSON limits, logging, Swagger and exception handling. `main.ts` starts local listening; `api/index.js` caches initialization for serverless requests and loads tsc-compiled modules to retain dependency-injection metadata.

No commerce backend is exposed yet. Existing catalogue, bag, wishlist and checkout remain frontend demonstrations. No fixture products are copied to the real database.

## Local development

Use Node 24 LTS (local validation also ran under Node 25), npm ci, npm run db:generate, then npm run dev:api and npm run dev in two terminals. API defaults to :4000; web defaults to :3000. npm run build/typecheck/lint/test orchestrate workspaces. npm run db:migrate uses the migration URL, not runtime pooler. The public database CA is checked into apps/api/certs; credentials remain ignored local environment files.

## Serverless preparation

Create separate Vercel projects with root directories apps/web and apps/api, sharing the repository lockfile/workspaces. The API config builds shared contracts and compiled Nest modules, includes public CA certificates and reuses one application/pool per warm function. Runtime pooling is capped at three connections per instance; function scaling must still be coordinated with the Supabase connection budget. No in-memory login sessions, workers, persistent disk or WebSockets are used. Set deployed APP_URL/API_URL/WEB_ORIGIN, Supabase redirect allowlists and server environment variables separately. A local adapter smoke test is not a Vercel deployment test; preview deployment remains unverified until explicitly recorded.

Primary implementation references: [NestJS authentication](https://docs.nestjs.com/security/authentication), [Vercel NestJS support](https://vercel.com/docs/frameworks/backend/nestjs), [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts), [Supabase verified database TLS](https://supabase.com/docs/guides/database/connecting-to-postgres).
