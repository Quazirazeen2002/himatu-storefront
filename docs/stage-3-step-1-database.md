# Database foundation

## What Prisma does

The Prisma schema is the TypeScript application's description of tables and relations. Prisma Client is generated code: it turns typed operations such as `prisma.db.userProfile.upsert(...)` into SQL. A migration is a versioned SQL change applied to PostgreSQL; generating a client does not apply a migration. This is similar to SQLAlchemy models, a generated query interface and Alembic migrations having separate jobs.

`apps/api/prisma/schema.prisma` defines UserProfile, Address, Category, Product, ProductImage and Inventory. Supabase Auth owns credentials and authentication identities; UserProfile stores the application-facing identity and role. It has a unique supabaseUserId. Addresses belong to one profile and cascade on profile deletion. Products reference categories with restricted deletion; product images/inventory cascade when their product is deleted.

Product price is an integer in minor currency units (BDT poisha), never a floating-point value. Products/categories start inactive. Quantity checks reject negatives and over-reservations. Unique partial indexes permit only one default address per user and one primary image per product. SKU, slugs, profile identity and product inventory relations have unique constraints. No product or stock records were seeded.

## Connections and TLS

The new free Supabase project is HIMATU, reference tqwgmmiljcumomhxwxit, region ap-southeast-1 (Singapore). `DATABASE_URL` uses the project's transaction pooler on port 6543 for runtime. `DIRECT_URL` uses the session pooler on 5432 for migrations because it works over IPv4 and maintains session semantics; the direct IPv6 database host is documented by Supabase as an alternative when supported.

Prisma 7.10.1 uses prisma.config.ts for the migration URL and a PrismaPg driver adapter for runtime. PrismaService is a reusable injectable provider with lazy connection creation, maximum pool size three, bounded connection/idle timeouts and disconnect on Nest shutdown. Health runs SELECT 1 without exposing connection strings or errors.

The runtime driver verifies the server with the public Supabase CA downloaded from Database Settings, stored in apps/api/certs/supabase-ca.crt. `DATABASE_SSL_CA_PATH` selects this CA. URL SSL parameters are removed only when this explicit verified CA configuration is supplied, preventing pg's URL parser from overriding the trusted SSL options. Verification is not disabled. Local isolated database tests use a separate localhost-only database.

## Migration

`20261108000000_initial_foundation` creates the schema, indexes, constraints and defense-in-depth RLS. Every application table has RLS enabled and no browser access policy. anon/authenticated database roles have application table privileges revoked when those roles exist. Customer data access goes through verified Nest endpoints, not browser Data API calls. The Prisma server connection is trusted and must remain private.

The migration was applied successfully to both an isolated PostgreSQL 18 instance and the actual Supabase project. `npm run db:status` reported the cloud schema up to date. The API health endpoint then reported database up through the verified runtime pooler. Profile integration tests create randomized test records and clean them up; no catalogue fixtures are seeded.

## Operations

```sh
npm run db:generate
npm run db:migrate
npm run db:status
```

For an empty disposable integration database, apply migrations with DIRECT_URL pointing at that database, then run the tests with TEST_DATABASE_URL. Never point disposable test scripts at a production database without reviewing their cleanup scope. The database integration suite deletes only its generated test identity.

The application has no endpoint for changing role. A project administrator may grant an application ADMIN role using trusted SQL after verifying the intended customer's identity:

```sql
UPDATE "UserProfile" SET "role" = 'ADMIN'
WHERE "supabaseUserId" = 'the-verified-auth-user-uuid';
```

Keep this operation server-side and audited. Supabase's Postgres JWT role `authenticated` is different from the application's CUSTOMER/ADMIN authorization role.

[Prisma configuration](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference), [Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma), [verified SSL connections](https://supabase.com/docs/guides/platform/ssl-enforcement).
