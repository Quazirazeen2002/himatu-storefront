# HIMATU — Stage 3 Part 1.1: Customer Authentication, Email Verification & Members-Only Access

## 1. Executive Summary & Architecture Overview

HIMATU is a premium e-commerce platform for anime figures and collectibles in Bangladesh. This release delivers a complete, production-grade customer authentication and access-control system featuring:
- **Members-Only Storefront Access**: All shopping, product discovery, catalog browsing, bag, wishlist, account, and checkout routes strictly require an authenticated, email-verified customer session.
- **Email OTP Verification**: Registration requires confirming a 6-digit one-time passcode (OTP) delivered via SMTP.
- **OTP-Based Password Recovery**: Secure self-service password reset using a 6-digit recovery OTP, eliminating magic link dependency and preventing email enumeration.
- **Decoupled Architecture**:
  - **Supabase Auth**: Manages credentials, tokens, OTP codes, and SMTP email dispatch.
  - **Next.js 16 Web Application**: Provides the customer UI, Route Handlers (`/api/auth/*`), and Next.js 16 server-side Proxy (`proxy.ts`) managing HTTP-only secure cookies.
  - **NestJS API Backend**: Independently validates cryptographic JWT bearer tokens (`jose` remote JWKS) and synchronizes verified customer profiles into PostgreSQL using Prisma ORM.

---

## 2. Architecture & Service Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CUSTOMER BROWSER                                │
│  - No tokens or passwords stored in client JavaScript or localStorage.     │
│  - All auth requests send 'X-Himatu-Request: 1' and credentials: same-origin │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │ HTTP-only Cookies
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS 16 WEB (apps/web)                          │
│                                                                             │
│  proxy.ts (Server-side Route Protection & Proxy):                           │
│    - Evaluates session before page rendering.                              │
│    - Redirects signed-out visitors from protected storefront routes to      │
│      /sign-in?next=<intended-destination>.                                  │
│    - Validates return paths to eliminate open-redirect vulnerabilities.     │
│    - Redirects unverified users to /verify-email?email=...                  │
│                                                                             │
│  Route Handlers (/api/auth/[action]):                                       │
│    - POST /api/auth/register       -> Supabase signUp()                     │
│    - POST /api/auth/sign-in        -> Supabase signInWithPassword()         │
│    - POST /api/auth/verify-otp     -> Supabase verifyOtp(signup/recovery)   │
│    - POST /api/auth/resend-otp     -> Supabase resend() / resetPassword()   │
│    - POST /api/auth/reset          -> Supabase resetPasswordForEmail()      │
│    - POST /api/auth/update-password-> Supabase updateUser({ password })     │
│    - POST /api/auth/sign-out       -> Supabase signOut() & clear cookies    │
│    - GET  /api/auth/session        -> Resolves profile via NestJS           │
└───────────────────────┬─────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴────────────────────────┐
         │ Bearer JWT (Server-to-Server)         │ Supabase Client SDK
         ▼                                       ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────────┐
│       NESTJS API (apps/api)      │   │            SUPABASE AUTH             │
│                                 │   │                                      │
│  - SupabaseAuthService:         │   │  - Identity & Credentials            │
│    Validates ES256/RS256 JWKS   │   │  - 6-digit OTP Generation            │
│    Verifies iss, aud, sub, exp  │   │  - Custom SMTP Dispatch              │
│  - UsersService:                │   │    (smtp.gmail.com:587)              │
│    Idempotent profile upsert    │   │  - Session & Refresh Tokens          │
│    into PostgreSQL UserProfile  │   └──────────────────────────────────────┘
└────────────────┬────────────────┘
                 │ Prisma ORM
                 ▼
┌─────────────────────────────────┐
│     SUPABASE POSTGRESQL DB      │
│  - UserProfile (UUID, email,    │
│    fullName, role: CUSTOMER)    │
│  - Address, Products, Orders    │
└─────────────────────────────────┘
```

---

## 3. Members-Only Access Control (Objective Five)

### Protected Routes
Every storefront and customer page is protected server-side by `apps/web/src/proxy.ts`:
- `/` (storefront home)
- `/shop`
- `/collections` & `/collections/*`
- `/products/*`
- `/bag`
- `/wishlist`
- `/account` & `/account/*`
- `/checkout`
- `/order-confirmation`
- `/campaign`
- `/3d-printing`
- Information pages: `/about`, `/contact`, `/faqs`

### Public Route Allowlist
Only necessary authentication entry points and static assets are public:
- `/sign-in`
- `/create-account`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/update-password` (backward compatibility)
- `/auth/callback` (PKCE exchange)
- Static assets: `/_next/*`, `/images/*`, `/art/*`, `/fonts/*`, `/favicon.ico`, `/icon.svg`, `/robots.txt`, `/sitemap.xml`
- Same-origin auth API: `/api/auth/*`

### Intended Destination Preservation & Open-Redirect Prevention
When a visitor attempts to access a protected URL (e.g. `/products/straw-hat-captain`):
1. `proxy.ts` detects no authenticated session.
2. `buildSignInRedirect(pathname, search)` sanitizes the path using `sanitizeRedirectPath()`.
3. The visitor is redirected to `/sign-in?next=%2Fproducts%2Fstraw-hat-captain`.
4. Protocol-relative URLs (`//attacker.com`), absolute URLs (`https://attacker.com`), backslashes (`/\attacker.com`), control characters, and auth-loop destinations (`/sign-in`, `/auth/callback`) are rejected and safely fall back to `/`.
5. Upon successful sign-in or registration verification, the user is automatically navigated back to their intended product page.

---

## 4. Customer Authentication Lifecycles

### A. Customer Registration with Email OTP
1. **Customer Submission**:
   - The customer enters Full Name, Email, Password, and Confirm Password at `/create-account`.
   - Client-side and server-side validation enforces strong password criteria (minimum 8 characters, at least one letter, at least one number).
2. **Identity Creation**:
   - Next.js calls `supabase.auth.signUp()`.
   - Supabase creates the unverified identity and dispatches a 6-digit OTP email using `{{ .Token }}`.
   - If an account already exists with that email, a clear `account_exists` message instructs the user to sign in or reset their password.
   - An unverified session is immediately signed out on the server so unconfirmed users cannot bypass access controls.
3. **Dedicated OTP Verification Page (`/verify-email`)**:
   - Polished 6-digit individual input boxes with auto-focus movement, backspace navigation, and clipboard paste support.
   - Active 60-second cooldown timer preventing resend abuse.
   - "Change email" option in case a typographical error occurred.
4. **OTP Confirmation & Profile Synchronization**:
   - Customer submits the code to `POST /api/auth/verify-otp` with `type: "signup"`.
   - Supabase verifies the code, transitions the user to `email_confirmed_at != null`, and returns an authenticated session.
   - Next.js forwards the bearer access token to NestJS (`GET /api/v1/users/me`), which idempotently creates or updates the customer's `UserProfile` in PostgreSQL.
   - Customer is redirected to their destination (or `/`).

### B. Sign-In with Verified Email
1. Customer enters email and password at `/sign-in`.
2. Supabase verifies credentials via `signInWithPassword()`.
3. If credentials are correct but `email_confirmed_at` is null:
   - Server signs out the session immediately.
   - Returns code `email_not_confirmed` and automatically redirects the customer to `/verify-email?email=<encoded-email>` with prefilled email.
4. If credentials are correct and verified:
   - Profile is synchronized with NestJS.
   - HTTP-only session cookie is issued (persistent 30-day cookie if "Remember me" is checked; browser-session cookie otherwise).
   - Customer is redirected to their requested destination.

### C. Forgot Password & OTP Recovery Flow
1. **Password Reset Request (`/forgot-password`)**:
   - Customer enters registered email.
   - Next.js invokes `supabase.auth.resetPasswordForEmail()`.
   - To prevent account enumeration, the interface displays a generic success confirmation regardless of whether the email exists.
   - The user is redirected to `/reset-password?email=<encoded-email>`.
2. **OTP Verification (`/reset-password`, Step 1)**:
   - Customer enters the 6-digit recovery OTP received in their inbox.
   - Submits to `POST /api/auth/verify-otp` with `type: "recovery"`.
   - Supabase verifies the OTP and establishes a recovery session; Next.js sets a temporary HTTP-only `himatu-recovery=1` cookie.
   - Interface transitions to Step 2 (New Password).
3. **Password Update (`/reset-password`, Step 2)**:
   - Customer enters New Password and Confirm Password.
   - Enforces password strength rules.
   - Server verifies the active recovery session and calls `supabase.auth.updateUser({ password })`.
   - Recovery session cookies are cleared, local session is terminated, and the customer is redirected to `/sign-in?reset=success`.
   - The customer can now log in using their new password; previous passwords are rejected.

---

## 5. Google Gmail SMTP Configuration (Owner Step-by-Step)

The intended sender email address is:
**`razeenjubair10@gmail.com`**

To enable live email delivery for verification and password recovery, follow these steps:

### Step 1: Enable Google 2-Step Verification
1. Navigate to your Google Account Security dashboard: [https://myaccount.google.com/security](https://myaccount.google.com/security).
2. Under "How you sign in to Google", confirm that **2-Step Verification** is turned **ON**.

### Step 2: Generate a Google App Password
1. Navigate directly to Google App Passwords: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. Enter an app name: `HIMATU E-Commerce`.
3. Click **Create**.
4. Google will generate a 16-character passcode (e.g. `abcd efgh ijkl mnop`).
5. **Copy this 16-character password immediately.** You will not be able to view it again.
> [!IMPORTANT]
> Never use your primary Google account password. Google SMTP requires an App Password. Never commit this password to Git or add it to frontend `.env` files.

### Step 3: Configure Custom SMTP in Supabase
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your HIMATU project.
3. In the left navigation, click **Authentication** (shield icon) > **SMTP Settings** (or **Email** > **SMTP Settings**).
4. Toggle **Enable Custom SMTP** to **ON**.
5. Fill in the following details:
   - **Sender email**: `razeenjubair10@gmail.com`
   - **Sender name**: `HIMATU`
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **Encryption**: `STARTTLS` (or TLS)
   - **SMTP Username**: `razeenjubair10@gmail.com`
   - **SMTP Password**: `<16-character-app-password-without-spaces>`
6. Click **Save Changes**.

---

## 6. Supabase Email Templates Configuration

Navigate to **Authentication** > **Email Templates** in the Supabase Dashboard:

### Template A: Confirm Signup (Account Verification)
- **Template**: *Confirm signup*
- **Subject**: `Verify your HIMATU account`
- **Body**:
```html
<h2>Welcome to HIMATU</h2>
<p>Thank you for joining our community of anime collectors.</p>
<p>Use the following verification code to confirm your email address:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #111;">
  {{ .Token }}
</p>
<p>This code will expire in 15 minutes.</p>
<p style="color: #666; font-size: 13px;">If you did not request this account, you can safely ignore this message.</p>
```

### Template B: Reset Password (Password Recovery)
- **Template**: *Reset password*
- **Subject**: `Reset your HIMATU password`
- **Body**:
```html
<h2>Reset your HIMATU password</h2>
<p>We received a request to reset your HIMATU account password.</p>
<p>Your 6-digit verification code is:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #111;">
  {{ .Token }}
</p>
<p>This code will expire in 15 minutes.</p>
<p style="color: #666; font-size: 13px;">If you did not request this password reset, please ignore this message.</p>
```

### Template C: Change Email Address
- **Template**: *Change email address*
- **Subject**: `Confirm your new HIMATU email address`
- **Body**:
```html
<h2>Confirm email change</h2>
<p>Please confirm your new email address using the code below:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #111;">
  {{ .Token }}
</p>
```

---

## 7. Supabase URL & Redirect Configuration

In **Authentication** > **URL Configuration**:

### Site URL
- Local development: `http://localhost:3000`
- Production: `https://<your-production-domain>.com`

### Redirect URLs (Allowlist)
Add the following entries under **Redirect URLs**:
```
http://localhost:3000/**
http://localhost:3001/**
http://127.0.0.1:3000/**
https://*-<your-org>.vercel.app/**
https://<your-production-domain>.com/**
```

---

## 8. Environment Variables Reference

### Frontend Web (`apps/web/.env.local`)
```bash
# Web application origin (used for origin matching and redirects)
APP_URL=http://localhost:3000

# Backend NestJS API endpoint
API_URL=http://localhost:4000

# Supabase project URL and anon public key
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>

# Local loopback origin relaxation (development only)
AUTH_ALLOW_LOCAL_ORIGINS=true

# Additional trusted origins (e.g. preview environments, comma-separated)
AUTH_ALLOWED_ORIGINS=
```

### Backend API (`apps/api/.env`)
```bash
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:3000

# PostgreSQL database connection strings
DATABASE_URL="postgresql://postgres:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Supabase Auth configuration
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
SUPABASE_JWT_ISSUER=https://<your-project>.supabase.co/auth/v1
SUPABASE_LEGACY_JWT=false

# Public CA cert path for SSL
DATABASE_SSL_CA_PATH=certs/supabase-ca.crt

# Optional SMTP reference documentation (configured directly in Supabase Dashboard)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=razeenjubair10@gmail.com
SMTP_SENDER_EMAIL=razeenjubair10@gmail.com
SMTP_SENDER_NAME=HIMATU
SMTP_PASSWORD=
```

---

## 9. Security Controls Summary

1. **HTTP-Only Cookies**: Authentication session tokens and PKCE state are stored in HTTP-only cookies (`sameSite: "lax"`, `secure: true` in production). Ordinary browser scripts cannot access them.
2. **CSRF & Origin Validation**: Every state-changing auth Route Handler verifies `X-Himatu-Request: 1` and matches the request `Origin` and `Host` against trusted origin configurations. Cross-site form submissions are rejected with HTTP 403.
3. **Sliding-Window Rate Limiting**:
   - Sign-in: 10 attempts per minute per IP+Email.
   - Registration: 5 requests per minute per IP+Email.
   - OTP Verification: 5 attempts per minute per IP+Email (brute-force defense).
   - OTP Resend: Strict 60-second cooldown per email address.
4. **Asymmetric JWT Verification**: NestJS independently validates the RS256/ES256 signature using remote JWKS from `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`, checking expiration, issued-at, UUID subject, issuer, and audience (`authenticated`).
5. **No Client Role Escalation**: The `UserProfile.role` is set strictly on the server (`CUSTOMER`). Client metadata cannot override database roles or grant administrative privileges.
6. **No Plaintext Passwords**: Passwords exist transiently in the POST body to Supabase Auth over TLS and are immediately cleared. No password hashes or credentials reside in the HIMATU PostgreSQL database.

---

## 10. Manual Testing Instructions

Once Gmail SMTP and Supabase settings are configured, verify the system end-to-end:

### Test 1: Members-Only Storefront Protection
1. Open an incognito browser window.
2. Directly visit `http://localhost:3000/`.
   - **Expected Result**: Immediately redirected to `http://localhost:3000/sign-in`.
3. Directly visit `http://localhost:3000/products/straw-hat-captain`.
   - **Expected Result**: Immediately redirected to `http://localhost:3000/sign-in?next=%2Fproducts%2Fstraw-hat-captain`.

### Test 2: Customer Registration & OTP Verification
1. On the sign-in page, click **Create an account** (navigates to `/create-account`).
2. Fill in:
   - Full Name: `Test Collector`
   - Email: `<your-test-email>`
   - Password: `CollectorPassword2026!`
   - Confirm Password: `CollectorPassword2026!`
3. Click **CREATE ACCOUNT**.
   - **Expected Result**: You are redirected to `/verify-email?email=<your-email>`. A 6-digit code email arrives in your inbox from `HIMATU <razeenjubair10@gmail.com>`.
4. Enter the 6-digit code in the digit boxes.
5. Click **CONFIRM & CONTINUE**.
   - **Expected Result**: Success banner appears; you are automatically redirected to the storefront (or intended product page).

### Test 3: Sign-In with Verified Account
1. Sign out via `/account` or your browser session.
2. Visit `/sign-in`.
3. Enter your registered email and password. Check **Remember me**.
4. Click **SIGN IN**.
   - **Expected Result**: You are signed in and redirected to the storefront.

### Test 4: Password Recovery Flow
1. Visit `/forgot-password`.
2. Enter your registered email and click **SEND RESET CODE**.
   - **Expected Result**: Redirected to `/reset-password?email=<your-email>`. A 6-digit recovery code email arrives.
3. Enter the 6-digit recovery code and click **VERIFY CODE**.
   - **Expected Result**: Form advances to Step 2 ("SET NEW PASSWORD").
4. Enter a new password: `NewCollectorPassword2026!`.
5. Click **UPDATE PASSWORD**.
   - **Expected Result**: Success message appears; redirected to `/sign-in?reset=success`.
6. Attempt to sign in with your old password -> rejected.
7. Sign in with `NewCollectorPassword2026!` -> successfully logged in.
