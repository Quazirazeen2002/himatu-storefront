# HIMATU Stage 2.5 completion report

Completed 8 November 2026 (Asia/Dhaka).

## Outcome

Enhanced the existing Next.js application in place with a premium landing page and a complete signed-out customer interface. The original HIMATU photography, catalogue, nine-entry pagination, product routes, demo bag, wishlist, search, filters, checkout, printing inquiry and light/dark toggle remain intact. No frontend framework, production backend or authentication provider was introduced.

## Inspection and implementation plan

Reviewed the current route structure, homepage, authentication pages, header/footer, product cards/data, design tokens/global styles, store provider and browser-persistent demo state. Read the repository instructions, relevant bundled Next.js Image guidance and the frontend-design skill. The implementation plan was shared before changes: refine the photographic landing composition, build accessible customer forms and recovery navigation, define an unconnected authentication boundary, then validate existing shopping behavior and all responsive routes.

## Landing experience

The compact announcement reads HIMATU — PREMIUM FIGURES & COLLECTIBLES. Navigation retains Shop All, Collections, New Arrivals and 3D Printing, plus search, wishlist, account, bag and the existing theme preference. Underlines and hover/focus states remain restrained. The account entry points now consistently open sign-in while signed out.

The hero retains the original Luffy action photograph and full HIMATU watermark. YOUR FANDOM. YOUR COLLECTION. leads into the requested supporting copy, EXPLORE COLLECTIONS primary action and SHOP ALL FIGURES secondary action. The layout preserves the complete product composition and adapts to a stacked mobile presentation.

Collection discovery pairs a large original One Piece photograph with links to the existing Naruto, Dragon Ball, Jujutsu Kaisen and Demon Slayer preview routes. Photographs for those four universes were not supplied, so they remain explicitly labelled photography-pending text presentations. No unrelated photograph or generated character was assigned to them.

Six selected genuine figures use shared product cards with bold names, wishlist controls and product links. Homepage cards omit unverified demo prices and stock states. This is a presentation option on the shared card/grid; the original catalogue records and demonstration commerce values were not modified.

Because no verified new-arrival records exist, the dedicated editorial collection section presents One Piece neutrally: THE STORIES STAY WITH YOU. The existing verified-only New Arrivals destination remains an honest empty state. Custom printing now uses YOUR IMAGINATION. MADE REAL., the requested supporting text and DISCOVER 3D PRINTING action. The brand statement uses three display lines: DISCOVER. COLLECT. DISPLAY. Existing footer routes and the absence of invented social URLs are preserved.

## Sign-in, registration and recovery

`/sign-in` pairs an original HIMATU figurine photograph and MAKE ROOM. FOR YOUR WORLD. editorial panel with WELCOME BACK., email/password fields, show/hide, remember-me preference preview, recovery navigation, submit state and registration link.

`/create-account` uses JOIN THE COLLECTION. with full name, email, password and matching confirmation. Password visibility is independently controlled for both fields. Registration requires at least eight characters, validates email/required fields and focuses the first error. Sign-in validates required credentials and email format without inventing a backend password policy.

`/forgot-password` is a new, explicit recovery preview with required/email validation and a return-to-sign-in link. It never claims that a recovery email was sent.

All customer forms show an unconnected notice before entry. Pending submissions disable fields, password controls and submit, expose aria-busy and show a loading indicator. Responses explicitly remain signed out. Password and confirmation values are cleared after the adapter responds; they are never persisted, logged or sent. Remember me is an in-memory intent preview, not a working session promise.

Forms have visible labels, associated errors/hints, accessible visibility-button names and aria-pressed state. Keyboard testing covered email-to-password-to-visibility order and activation. The form precedes the editorial panel in document order, while CSS places the photo left/form right on desktop. Mobile presents the form first both visually and for keyboard users. The account foundation and order-history foundation remain available at their existing routes.

## Authentication integration readiness

`src/lib/auth-service.ts` defines:

- `CustomerSession`: a minimal UI-facing customer identity, without tokens or password storage.
- `AuthenticationService`: `connected`, `getSession()`, `signIn()`, `register()` and `requestPasswordReset()`.
- Typed sign-in/registration inputs and an `AuthResult` union with explicit disconnected, credential and network error states.
- `accountHref(session)`: `/sign-in` for null and `/account` for a real session.

The current adapter returns null session and `not_connected` for every operation. Its documented 350ms preview delay makes loading/disabled states reviewable; no network request occurs. It does not fabricate accounts, tokens or successful login state.

Stage 3 can replace the adapter with Supabase Auth, map real outcomes to this contract, add a session provider and feed actual session state into the shared account helper. Provider configuration, real session persistence, email verification/recovery redirects and authenticated routing are intentionally not implemented. No Supabase package, environment configuration, NestJS, Prisma, payment or order integration was added.

## Typography, visual system and performance

Reused the existing self-hosted licensed Barlow Condensed 800 italic/700 normal, Inter 500/600/700 and Geist Mono metadata faces. The dark palette remains #000000 background, #0A0A0A surface, #111111 elevated, #262626 border, #FFFFFF foreground, #A0A0A0 secondary and #D92727 accent. White primary actions use black text; the light palette and persistent toggle remain functional.

`customer-experience.css` scopes the landing/auth layouts. Responsive clamp() typography, 52px fields, 44px password controls, defined image stages, subtle photo zoom, underline transitions and existing section reveals support the visual direction. Reduced-motion preferences disable added transitions/spinner animation and retain the existing hero behavior. No new animation library or experimental page-transition API was enabled.

Images continue through the existing Next Image wrapper with local sources, responsive sizes, defined aspect ratios and lazy loading below the fold. The homepage hero remains prioritized. No original photo was edited or deleted. All seven JPEG hashes match their recorded baseline.

## Validation

- `npm run build`: passed; final production build generated successfully.
- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings or errors.
- All 36 content routes at 320, 375, 390, 768, 1024 and 1440px: 216 checks passed with HTTP 200, one settled h1 and no document horizontal overflow.
- Four retired product redirects still resolve correctly; an unknown product returns the expected 404.
- Authentication checks: required fields, invalid email, minimum registration password length, confirmation mismatch/focus, independent visibility, pending/disabled controls, explicit disconnected responses, cleared secrets, unchanged browser storage and no authentication POST requests passed.
- Navigation: hero destinations, sign-in/registration/recovery links, global signed-out account entry, mobile menu focus/close and keyboard field/control order passed.
- Shopping regressions: franchise/price/type/availability filters, search, price sorting, zero results, nine/one pagination, back/forward and sort reset passed. Non-sale concept safeguards and wishlist persistence passed. Original-figure bag feedback, persisted quantities, checkout required validation and the full local review flow passed.
- Printing required-field validation passed. Header search, theme persistence, light authentication layout and reduced-motion checks passed.
- All six final screenshots had loaded images, no horizontal overflow, no page/console errors and no failed responses during capture. Desktop/mobile landing and customer form compositions were visually reviewed.

The route audit excludes the deliberately probed missing-product 404 from asset failures. Keyboard-order review prompted the form-first DOM correction, followed by a final build, responsive audit and targeted keyboard checks. These are Chromium checks, not cross-browser or screen-reader certification.

Evidence: [authentication audit](../output/playwright/stage-2-5/auth-audit.txt), [route audit](../output/playwright/stage-2-5/route-audit.txt), [shopping regression](../output/playwright/stage-2-5/shopping-regression.txt), [keyboard/pagination audit](../output/playwright/stage-2-5/keyboard-pagination-audit.txt), [screenshot audit](../output/playwright/stage-2-5/screenshot-audit.txt), [photo integrity](../output/playwright/stage-2-5/photo-integrity.json).

## Screenshots

Full-page captures use 1440×900 desktop and 390×844 mobile viewports in dark mode with an empty demo bag/wishlist. Existing scroll reveals were triggered and images/fonts allowed to finish loading.

- [Landing desktop](../output/playwright/stage-2-5/landing-desktop.png)
- [Landing mobile](../output/playwright/stage-2-5/landing-mobile.png)
- [Sign-in desktop](../output/playwright/stage-2-5/sign-in-desktop.png)
- [Sign-in mobile](../output/playwright/stage-2-5/sign-in-mobile.png)
- [Registration desktop](../output/playwright/stage-2-5/registration-desktop.png)
- [Registration mobile](../output/playwright/stage-2-5/registration-mobile.png)

## Files and documentation

Added `src/lib/auth-service.ts`, `src/app/customer-experience.css`, `/forgot-password` and this report. Refined the existing homepage, campaign components, header, shared card presentation and AuthForm. Updated `docs/design-system.md` and `docs/page-structure.md`. All prior application routes, commerce data, public photographs and AI concept assets remain.

## Remaining limitations

Authentication and recovery are intentionally unconnected; no account, login session or email delivery is created. Catalogue prices/stock remain clearly labelled demo fixtures. Homepage pricing and new-arrival claims await verified business data. Four existing franchise previews still need approved photographs. No shipping promises, promotions, product specifications or social channels were invented. Production authentication, catalogue verification, commerce services, legal approval and broader device/assistive-technology testing remain future work.

## Follow-up: visible landing sign-in action

Moved sign-in access from the top-right account icon to an explicit outlined SIGN IN button in the landing hero. Mobile navigation retains Sign in. Build, typecheck and lint pass; the button destination and layout were verified at all six requested widths without horizontal overflow. Earlier screenshots document the original Stage 2.5 delivery before this follow-up.
