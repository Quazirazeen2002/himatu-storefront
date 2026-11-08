# Customer authentication

## Services and boundaries

Supabase Auth stores passwords and manages verification, recovery, access tokens and refresh tokens. HIMATU does not create another password database. Next.js is the customer-facing server: its Route Handlers call the supported Supabase SDK and write HTTP-only cookies. NestJS is the API: it independently verifies bearer access tokens before reading/updating the customer's PostgreSQL profile through Prisma.

The browser receives customer profile data and status messages, not auth tokens. Bag/wishlist localStorage remains independent and stores only validated product IDs/quantities. Passwords exist only transiently in the form and the request to Supabase through the web server; they are cleared after submission and never logged or persisted.

## Endpoints

Web, same origin:

- POST /api/auth/register — strict shared registration input; full_name metadata; verification feedback.
- POST /api/auth/sign-in — verified password sign-in and cookie session.
- POST /api/auth/sign-out — local session sign-out and cookie clearing.
- POST /api/auth/reset — generic recovery response to avoid email enumeration.
- POST /api/auth/update-password — requires a verified session, changes password and signs out locally.
- GET /api/auth/session — verifies Supabase user, refreshes cookies and asks Nest for the current customer; signed-out responses contain no profile.
- POST /api/auth/profile — permitted profile fields only, forwarded as a PATCH to Nest.
- GET /auth/callback — exchanges PKCE code, accepts only fixed account/recovery destinations, otherwise redirects to an explicit verification error.

API, prefix /api/v1:

- GET /health — application/database readiness; 503 if database is unavailable/unconfigured.
- GET /users/me — protected current customer profile.
- PATCH /users/me — protected fullName/phone update, no supplied owner, email or role.
- /api/docs and /api/docs-json — Swagger/OpenAPI in non-production only.

## Secure session strategy

The Supabase SSR server client uses cookie storage exclusively. HTTP-only cookies cannot be read by ordinary browser JavaScript. Production cookies are Secure and SameSite=Lax. Remember me uses a bounded persistent lifetime; unchecked cookies are session cookies. Refresh happens in writable Route Handlers, not Server Components. Session responses use no-store and Vary: Cookie.

Every state-changing web request requires the exact APP_URL origin and X-Himatu-Request header with JSON content. Cross-origin/missing-header requests fail before auth operations. There is no wildcard credentialed CORS. Nest accepts only bearer authorization and uses an explicit WEB_ORIGIN CORS allowlist. API logs contain method/path/status/request ID and duration, never authorization headers or request bodies.

## JWT and roles

SupabaseAuthService uses jose remote JWKS with cached public keys and rotation cooldown, accepting ES256/RS256 signatures. It requires configured issuer, authenticated audience, expiry, issued-at, UUID subject, email and authenticated Postgres role. Anonymous tokens and unsupported signing algorithms are rejected. Signature decoding alone is never authentication. An explicit optional legacy-HS256 mode delegates verification to the configured Supabase Auth server; it does not trust a decoded token or user-supplied role.

AuthGuard resolves the verified subject to an idempotent profile upsert with CUSTOMER as the creation role. It synchronizes the verified email without overwriting an existing trusted role or customer-edited name. RolesGuard checks the database role attached by AuthGuard. User metadata can supply a display name, never ADMIN. DTO validation and shared strict schemas reject owner/role/email fields in profile updates.

## Existing UI

The current photographic sign-in/registration layouts are retained. Validation, independent visibility controls, loading/disabled states and first-error focus remain. Successful real sign-in navigates to /account; account handles signed-out/expired/unavailable states and displays the verified profile. Mobile and landing session links switch between SIGN IN and MY ACCOUNT using the server session endpoint. The top-right account icon remains removed as requested.

Registration requires name/email/password/confirmation; confirmation is checked before calling the SDK. Supabase handles account identity and email confirmation. Recovery links route through /auth/callback to /update-password; invalid/expired callbacks show actionable feedback. No successful response is fabricated when services fail.

## Configuration

apps/web/.env.local (ignored): APP_URL, API_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY. There are no required NEXT_PUBLIC auth variables because auth runs through server routes.

apps/api/.env (ignored): DATABASE_URL, DIRECT_URL, DATABASE_SSL_CA_PATH, WEB_ORIGIN, PORT, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_JWT_ISSUER. SUPABASE_SECRET_KEY is reserved for future trusted administrative operations and is not required for customer JWT verification. It must never be exposed to web browser code. No elevated key is needed for the implemented customer endpoints.

Set Supabase Site URL and allowed redirects to the actual web origin. Local default is http://localhost:3000 with /auth/callback and its fixed password-recovery destination. Before deployment replace these with the approved production and preview origins. Configure SMTP and approved email templates/domain before public signup; live email delivery must be verified separately from SDK request success. PKCE verification links must be completed in the initiating browser, because that browser holds the HTTP-only verifier cookie.

## Beginner example

The frontend adapter calls `authService.signIn({email,password,remember})`. It POSTs to the web route; the route invokes `client.auth.signInWithPassword(...)` and sets cookies. On the account page, currentProfile() first calls `supabase.auth.getUser()`, then forwards `session.access_token` to GET /api/v1/users/me. The Nest guard checks JWT cryptography and calls `users.synchronize(identity)`, which runs `prisma.db.userProfile.upsert(...)`. The browser receives the resulting profile only.

This is analogous to a Python frontend-facing view setting secure cookies, an authenticated FastAPI dependency verifying a token, and a SQLAlchemy service retrieving a row. Next handles pages/cookies, Nest handles application API rules, Prisma builds SQL, and Supabase provides hosted Postgres plus the authentication identity system.

[Supabase server-side auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts), [Next.js authentication](https://nextjs.org/docs/app/guides/authentication).

## Current email sender decision

The owner selected razeenjubair10@gmail.com and explicitly requested that email setup remain pending. The ignored API environment records Gmail SMTP host/port, intended sender and username, with SMTP_PASSWORD empty. These fields are preparation only: custom SMTP has NOT been enabled in Supabase. The sender/provider may be changed later in Supabase Authentication email settings without changing customer records or the database schema. Gmail SMTP requires an app password and eligible Google account security setup; never use the normal Google password or commit the credential. Until configured and tested, public verification/recovery email delivery must not be represented as operational.

[Supabase email sender restrictions](https://supabase.com/docs/guides/auth/auth-smtp), [Google app-password requirements](https://support.google.com/accounts/answer/185833).

## Local origin fix — 8 November 2026

The customer used localhost:3001 while APP_URL was localhost:3000, so the original exact-origin CSRF check rejected otherwise legitimate form requests. The web server now optionally accepts same-origin loopback aliases/ports when AUTH_ALLOW_LOCAL_ORIGINS=true and APP_URL itself is loopback. The request's Host must match the supplied local Origin; an Origin from a different local port or external website still rejects. Deployed APP_URL values never inherit this local exception. Additional trusted deployment origins can be explicitly listed in AUTH_ALLOWED_ORIGINS without wildcards.

Trusted local registration/recovery callbacks and callback redirects preserve the initiating origin to keep the PKCE verifier and session cookies on the same host. Corresponding Supabase redirect allowlists must be set before email delivery is enabled for another origin.

The running localhost:3001 auth endpoint was verified to return normal form validation rather than the origin 403. Localhost/127.0.0.1 requests passed; mismatched local ports and attacker origins still returned 403. Seventeen web tests pass, including seven origin-security cases and four actionable provider-error cases. Web build/typecheck/lint pass. Email confirmation configuration remains pending; this fix does not disable verification or create a customer account.

Provider errors now distinguish email delivery restrictions, unverified email, incorrect credentials, invalid addresses, weak passwords and throttling without returning raw provider text.

## Email quota clarification

The web interface now distinguishes Supabase's `over_email_send_rate_limit` (account-email sending quota) from `over_request_rate_limit`/generic 429 throttling. The former does not imply that password sign-in for existing verified accounts is unavailable, and repeatedly trying registration cannot fix the sending configuration. Verification and password recovery remain dependent on an operational sender. No rate-limit bypass or automatic verification was introduced. The owner requested Gmail app-password setup instructions; SMTP_PASSWORD is still empty until supplied securely. Web build/typecheck/lint and 18 web tests passed after the message correction.
