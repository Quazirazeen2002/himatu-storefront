# Stage 3 Step 1 implementation report

8 November 2026 (Asia/Dhaka).

## Status

The backend foundation and real password sign-in/profile/session integration are implemented and validated against the new Supabase project. The original storefront remains functional after migration into npm workspaces.

**Email setup is intentionally pending at the owner's request.** The intended sender is razeenjubair10@gmail.com and may be changed later. Public registration verification and password-recovery email delivery have not been validated end to end. The implementation handles SDK responses and PKCE callbacks, but does not claim emails were delivered. Vercel deployment preparation is implemented and locally smoke-tested; no actual Vercel preview deployment was performed, so deployment readiness is not certified.

## Architecture changes

Moved the existing frontend source, photographs, fonts and build configuration into `apps/web` without duplication. Existing routes, asset URLs, typography, theme toggle, pagination, discovery, cart and wishlist remain. Root npm workspaces now orchestrate `apps/web`, `apps/api` and `packages/shared` with one lockfile. The migration plan was documented before moving files in [architecture](stage-3-step-1-architecture.md).

`apps/api` contains NestJS 12.4.0 modules for configuration, Prisma, health, JWT authentication and users. Prisma 7.10.1 is pinned to the stable major instead of the release candidate advertised by npm's latest tag. Shared Zod 4 contracts validate client-facing auth/profile requests. Supabase SDK and SSR packages implement server-side identity/session operations. No separate password store or production commerce backend was created.

Next Route Handlers keep Supabase tokens in HTTP-only cookies, enforce same-origin request checks and forward a bearer token to the API. Nest verifies JWKS signatures and claims, retrieves/creates a CUSTOMER profile and applies database-backed role/ownership checks. Browser-controlled metadata cannot grant ADMIN. The top-right account icon stays removed; landing/mobile session navigation reflects the verified customer response.

## Supabase and database results

Created **HIMATU** on the existing free organization, region Singapore (`ap-southeast-1`), project reference `tqwgmmiljcumomhxwxit`. The unrelated existing project was untouched. Automatic new-table exposure was disabled and automatic RLS enabled when creating the project. Application migrations also enable RLS and revoke browser role table privileges.

- Actual cloud migration `20261108000000_initial_foundation`: applied successfully.
- `npm run db:status`: cloud database schema up to date.
- Runtime transaction pooler on 6543: healthy using the public Supabase CA with certificate verification enabled.
- Migration session pooler on 5432: successful, usable over IPv4. The direct IPv6 host is an alternative when supported.
- GET `/api/v1/health`: HTTP 200, database up.
- Swagger `/api/docs-json`: HTTP 200; unauthenticated `/api/v1/users/me`: HTTP 401.
- Same migration applied to an isolated local PostgreSQL 18 database. Real integration tests verified connectivity, idempotent profile creation and preservation of trusted database roles.

Models cover UserProfile, Address, Category, Product, ProductImage and Inventory with relations, indexes, safe deletion behavior, integer minor-unit prices, nonnegative inventory/money constraints and single-default/single-primary indexes. No fake products or stock were seeded. A final database check confirmed zero Product, Inventory and Category records.

Credentials are stored only in ignored local files with restricted permissions. The downloaded CA certificate is public and is included in `apps/api/certs`. Customer endpoints do not require an elevated Supabase secret key; its environment placeholder remains reserved for future trusted administration. No database credential or elevated key is exposed in NEXT_PUBLIC variables or browser auth state.

## Authentication test results

A disposable confirmed identity was created through the project dashboard's no-email administrative test flow. Its random password was never printed in reports/chat or committed. Real SDK sign-in then produced a Supabase access token accepted by Nest; Prisma created and returned a CUSTOMER profile with HTTP 200. The disposable profile and test identity were removed after verification.

Chromium verified:

- Real sign-in through the existing form redirects to account and loads the real profile.
- Session cookies are HTTP-only and Secure; document.cookie does not expose auth cookies.
- Passwords are absent from application localStorage; no application token storage was introduced.
- Profile update succeeds for the authenticated customer.
- Landing navigation becomes MY ACCOUNT after a verified session response.
- Sign-out removes browser account access.
- Invalid credentials show failure rather than a fake session.
- Registration required fields and password-confirmation checks pass.
- Email validation, visibility control, loading/disabled state and invalid/expired callback feedback pass.
- Cross-origin sign-in POST is rejected with HTTP 403.

Actual cloud email verification/recovery delivery is NOT marked passed. Reserved example-domain signup probes were rejected by the provider, and Supabase's default SMTP is restricted to organization members. The owner explicitly chose to defer custom Gmail SMTP credentials/configuration. Local callback URLs were added; the Site URL remains localhost:3000. Production/preview origins and real mailbox tests remain owner setup.

## Automated checks

- `npm run build`: passed for shared contracts, Nest API and existing Next app.
- `npm run typecheck`: passed across workspaces.
- `npm run lint`: passed with no warnings/errors.
- `TEST_DATABASE_URL=<isolated database> npm run test`: **21 tests passed** (15 API/database, 6 web contract tests). A plain `npm run test` safely skips the one disposable-database integration test when TEST_DATABASE_URL is absent.
- JWT tests use actual asymmetric signatures and an ephemeral JWKS HTTP server. Missing/malformed/expired/wrong-signature/wrong-issuer/wrong-audience/bad-subject/bad-role tokens reject. A valid customer token passes. Metadata role elevation, profile-owner injection and forbidden profile fields reject; a trusted database ADMIN passes the roles guard.
- All 37 content routes × six widths (320, 375, 390, 768, 1024, 1440): **222 combinations passed** with HTTP 200, one settled h1 and no horizontal overflow.
- Four old product redirects and the expected unknown-product 404 passed.
- Shopping regression checks passed for filters, search, type/availability/price discovery, pagination query preservation, concept purchase safeguards, wishlist persistence, cart feedback/persisted quantity, checkout validation/review, mobile modal focus, theme persistence and reduced motion.
- Seven original HIMATU photographs match baseline SHA-256 hashes after relocation.
- Two sequential requests through the cached serverless handler returned healthy database responses, demonstrating local adapter reuse. This is not a deployed Vercel test.
- Runtime dependency audit (`npm audit --omit=dev`) reported zero advisories. Development-only transitive tooling advisories remain; no forced breaking upgrade of the test toolchain was used to hide them.

Jest's ESM-only dependency transform is test-only; production Nest code uses compiled modules with decorator metadata preserved. A local HTTP-listener sandbox restriction was resolved by running the integration checks with the required local-network execution permission. TLS was repaired with the trusted CA, not by disabling certificate verification.

## Evidence and screenshots

- [Cloud login/profile result](../output/stage-3-step-1/live-api-auth.json)
- [Real browser authentication](../output/stage-3-step-1/browser-auth.json)
- [Form and CSRF checks](../output/stage-3-step-1/form-security.json)
- [Responsive route audit](../output/stage-3-step-1/routes.txt)
- [Shopping regression](../output/stage-3-step-1/shopping.txt)
- [Photo integrity](../output/stage-3-step-1/photo-integrity.json)
- [Landing desktop](../output/stage-3-step-1/landing-desktop.png)
- [Sign-in desktop](../output/stage-3-step-1/sign-in-desktop.png)
- [Sign-in mobile](../output/stage-3-step-1/sign-in-mobile.png)
- [Signed-out account state](../output/stage-3-step-1/account-signed-out.png)

## Files created and modified

Created API modules under `apps/api/src/{auth,users,health,prisma,common,config}`, bootstrap/main, Express serverless adapter, Prisma schema/config/migration, public CA certificate, API package/TS/Jest/ESLint/Vercel configuration and API tests. Created `packages/shared` schemas/types/build configuration. Created web server-auth helpers, same-origin auth handlers, callback route, update-password page, customer-account/session-link components and web contract tests. Added separate web/API `.env.example` files and four Stage 3 documentation files.

Modified root package/workspace scripts, lockfile, .gitignore and README. Relocated the frontend into `apps/web`; modified its auth adapter/form, account/sign-in route, landing/mobile session links and small profile-form styling. Updated current design-system and route documentation to explain workspace/auth changes. Existing product data, commerce state code, original photographs and non-sale concept assets remain unchanged.

## Beginner explanation

Next.js serves the shop and account screens and safely handles browser cookies. Supabase Auth checks passwords and issues identity tokens. NestJS receives application API requests and checks those tokens before deciding whose profile may be accessed. Prisma converts typed service calls into SQL against Supabase PostgreSQL. Swagger documents the API; migrations record database changes; the browser never connects with a database password.

In Python terms, think of Next as the page-facing web layer, Nest as the API/service layer, Prisma as the typed ORM/query layer, and Supabase as hosted PostgreSQL plus the identity provider. The database schema, generated query client and migration SQL are separate artifacts with different jobs.

## Remaining owner configuration

1. Email delivery: supply a Gmail app password securely and configure/test custom SMTP in Supabase, or choose another sender/provider. Sender choice can be changed later. This was explicitly deferred.
2. Set approved production/preview APP_URL, API_URL, WEB_ORIGIN and Supabase redirects before deployment; configure server-only environment variables in each Vercel project.
3. Run actual Vercel preview deployment/build/endpoint tests before claiming deployment readiness.
4. Establish ongoing administrative role-grant/account-deletion procedures, email deliverability monitoring and deployment connection budgets. Current product data, stock, checkout and payments remain outside this step.

## Follow-up: account requests rejected on localhost:3001

Fixed the local origin mismatch reported by the owner: APP_URL referenced port 3000 while the browser used port 3001. Opt-in same-origin loopback support preserves strict production checks and rejects cross-port/cross-site requests. Local callbacks preserve the trusted initiating origin. The exact running port-3001 endpoint was verified to pass origin checks. Web build/typecheck/lint and 17 web tests passed. Improved provider messages expose email-setup/verification problems separately from credential errors. SMTP remains pending as previously requested; no verification requirement was bypassed.
