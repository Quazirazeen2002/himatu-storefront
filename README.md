# HIMATU

Premium collectibles storefront, now an npm workspace with a Next.js web application and a NestJS customer API backed by Supabase Auth/PostgreSQL and Prisma.

## Structure

- `apps/web`: existing Next.js 16 / React 19 storefront, local photographs/fonts, browser shopping demonstrations and server-side auth routes.
- `apps/api`: NestJS API, Prisma schema/migrations, JWT/profile authorization, Swagger and serverless entrypoint.
- `packages/shared`: shared Zod schemas and customer types.
- `docs`, `design-references`, `output`: documentation, original references and QA evidence.

The frontend was moved intact from the repository root. Asset URLs and storefront routes are preserved; application code is not duplicated.

## Local development

Use Node 24 LTS and npm. Install from the root:

```sh
npm ci
npm run db:generate
npm run dev:api
```

In a second terminal run `npm run dev`. Web: http://localhost:3000. API: http://localhost:4000/api/v1/health. Development Swagger: http://localhost:4000/api/docs.

Copy `apps/web/.env.example` to `.env.local` and `apps/api/.env.example` to `.env` when configuring a fresh checkout. Actual local project configuration is ignored and must not be committed. The current workspace is connected to the HIMATU Supabase project; see the Stage 3 report. Database credentials belong only in the API server environment. No Supabase secret key belongs in NEXT_PUBLIC variables.

```sh
npm run db:migrate
npm run db:status
npm run build
npm run typecheck
npm run lint
npm run test
```

API cryptographic tests run locally with an ephemeral JWKS server. Database integration tests require a migrated disposable `TEST_DATABASE_URL`; otherwise that one integration test is explicitly skipped. All tests, including that suite, were run against a separate isolated PostgreSQL instance during implementation. Do not use production data for disposable tests.

For production previews use `npm run start:api` and `npm start` after building. The API uses a small pooled runtime connection and a trusted public CA certificate; migrations use a separate session/direct URL. No database passwords are printed in documentation.

## Authentication

Customer forms use same-origin Next Route Handlers. Supabase Auth owns passwords and identity. Sessions use server-written HTTP-only cookies; the browser receives profile data, not access tokens. NestJS independently verifies Supabase JWT signatures and claims, then uses Prisma to create/synchronize a CUSTOMER profile. Profile ownership and database roles are enforced on the API. Registration, email verification, sign-in, sign-out and recovery interfaces use the real SDK, with explicit provider errors instead of fabricated success.

Public email delivery requires approved sender/SMTP configuration and verification. Production/preview callback domains must be allowlisted in Supabase. Vercel entrypoints/configuration are prepared, but no Vercel preview deployment is claimed without an actual test.

## Commerce boundary

Seven genuine HIMATU photographs and the three labelled non-sale AI concepts remain. Existing prices/stock are demonstration fixtures; bag, wishlist and recently viewed IDs remain browser-persistent. Checkout, payments, orders, printing inquiries and inventory management are not production services in this step. No fake product/stock rows are seeded into PostgreSQL.

Start with [Stage 3 architecture](docs/stage-3-step-1-architecture.md), [database](docs/stage-3-step-1-database.md), [authentication](docs/stage-3-step-1-authentication.md) and [completion report](docs/stage-3-step-1-completion-report.md). Earlier stage reports remain historical records; their old source paths refer to the frontend before workspace relocation.
