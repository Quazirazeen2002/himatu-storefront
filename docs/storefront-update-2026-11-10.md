# HIMATU storefront and admin product update

Completed locally on 10 November 2026 (Asia/Dhaka). This change has not been deployed to Hostinger.

## Changes

- Moved the hero headline to the bottom centre, reduced its scale to keep the photography visible, and retained one “Shop the collection” CTA. Existing photograph slides, controls and reduced-motion behavior remain.
- Moved the complete six-letter HIMATU story and animation after the making-of section, immediately before the footer.
- Added the supplied Facebook and Instagram URLs with icons and community labels to the theme-aware footer.
- Changed the shared WhatsApp destination to `8801714546809` and removed the two requested closing sentences from order drafts. No messages were sent during verification.
- Added green in-stock and red unavailable/pre-order indicators to cards, quick views and product details. Source-photo demo references continue to show an availability enquiry rather than an invented stock claim.
- Removed the small delivery claim beneath Buy Now and the small text beneath the final checkout action. Operational errors and demo price labels remain.
- Opened storefront browsing to guests. Checkout, account, order confirmation and administration still require authentication; unverified customers are directed to email verification. The WhatsApp checkout handler also checks that a customer session exists.

## Admin product fixes

The uploader previously sent `images`, while the API accepted `files`. The storefront also only patched prices on a static list and never added database-created products. Both defects are fixed.

- Public API products now supply product names, descriptions, prices, stock, categories and galleries to the storefront. Every API page is loaded before local filtering and nine-product pagination. Database-managed figures are authoritative; source-attributed demo references remain separate.
- Product detail routes resolve newly created slugs dynamically, without a rebuild. Deliberately archived figures return 404 instead of being restored from the old static catalogue.
- New products can include up to ten JPEG, PNG or WebP photographs at creation, or through the existing photograph manager. Limit: 10MB per file. The first photograph becomes the default cover.
- Upload failures after creation explicitly report that the product was saved and open the photograph panel for retry, avoiding a misleading instruction to create the product again. Duplicate save/upload actions are guarded while pending.
- Gallery cover selection, ordering and deletion remain available. The specific reorder API route now precedes the image-ID route so `reorder` is not interpreted as an image ID.
- Cart and wishlist persistence accept dynamic catalogue slugs. Search and recently viewed products use the current catalogue. Checkout product resolution handles API catalogues larger than fifty products.
- Increased multipart proxy/request timeouts so a legitimate multi-photo upload has time to finish. Removed stale upstream content-length headers from proxied responses.
- Direct database fallback administrator routes now require an administrator profile. Customer-editable user metadata cannot assign an administrator role through that fallback.
- Empty product specifications no longer default to invented manufacturer/material/scale claims in the creation form.

## Validation

- `npm run build`: passed for the existing monorepo.
- `npm run typecheck`: passed.
- Frontend tests: 104 passed, including guest access, protected purchase routes, dynamic products/galleries, pagination retrieval, WhatsApp formatting and administrator fallback permissions.
- Backend tests: 71 passed; one opt-in database integration test skipped. HTTP tests needed localhost listener permissions. Includes multiple-file upload routing, image reorder routing, product/inventory, authentication/ownership, categories, admin summaries, orders, printing, payments and analytics.
- `npm run lint`: fails on existing repository issues: 16 API errors; 90 web errors and 152 warnings. This is not a clean-lint certification. The edited product admin component has no lint errors; it retains existing image and hook warnings. Existing broad commerce API/BFF typing issues remain.
- Production preview: seventeen public paths returned 200; guest checkout, account and admin requests redirected to sign-in.
- Isolated browser workflow: created a product with two images, found it in Shop, opened its dynamically resolved detail route and two-image gallery, added it to the bag, and navigated to checkout. Cover selection and reordering passed. Setting inventory to zero showed red out-of-stock state and disabled purchase controls; restoring stock worked.
- WhatsApp browser test intercepted `window.open`: one draft, correct new number, customer and product details preserved, requested closing text absent. No external message or real order was created.
- Responsive check: homepage, filtered shop, dynamic product, bag and checkout at 320, 375, 390, 768, 1024 and 1440px: no horizontal overflow or uncaught page errors in that sweep.
- Reduced motion and dark/light footer checked in Chromium.
- Read-only Supabase check: `product-images` exists, is public, permits JPEG/PNG/WebP and has a 10MB limit. This check did not upload or modify storage files.

Browser fixtures used an isolated UI copy with authentication bypassed only in that temporary test copy, plus a localhost mock API. Production source retains its authentication and API role checks. These tests do not certify every live dashboard action, real payment processing, or a live customer sign-up. Existing email sender setup remains outside this change.

## Evidence and deployment

Screenshots: `output/playwright/storefront-update/` includes desktop/mobile hero, social footer in both themes, product creation, image manager, new shop card, two-image product gallery, unavailable state, bag, checkout and intercepted WhatsApp draft.

Updated source uploads:

- `output/hostinger/HIMATU-Frontend-2026-11-10.zip` for `himatu.com`: Next.js, Node 22, root `./`, build `npm run build`, output `.next`.
- `output/hostinger/HIMATU-API-2026-11-10.zip` for `api.himatu.com`: NestJS, Node 22, root `./`, build `npm run build`, output `dist`, entry `server.js` where requested.

Both flattened packages were separately installed and built successfully, using the previously validated deployment layout. Archive source hashes match the current repository. ZIPs exclude environment files, secrets, installed dependencies and previous build output. Existing Hostinger environment variables must be retained. Upload the API package first, then the frontend package using Redeploy → Upload new files; do not delete either website.

Production customer/admin and real storage upload checks should be performed after both packages have been redeployed. No deployment, real customer account, order, payment, product or storage mutation was made in this task.

## Follow-up refinement: specifications, inventory and mobile navigation

Implemented locally on 10 November 2026 after the initial update:

- Removed the “Photography & product information”, “About this figure” and “Delivery & returns” sections from product details.
- Retained the owner's existing specification values and presented them as a bold, theme-aware specification panel. Product descriptions have stronger typographic weight.
- Added specification editing to Admin → Products → Edit. Administrators can change existing values, add custom fields and remove fields. Blank values are hidden on the storefront. Existing API/database specification storage is reused; no migration is needed.
- Reworked Inventory into separate product-category groups, with franchise grouping as an alternative. Includes category selection, name/SKU/franchise search, low/out-of-stock filters, per-group unit totals, and stock editing. All API pages are loaded, so inventory is not silently truncated at 100 products.
- Stock filtering/counts use available stock after reservations. The stock editor prevents totals below reserved units and uses the existing modal for keyboard focus and Escape handling.
- Inventory tables become product cards on mobile. Fixed a legacy admin header style collision that caused wrapping controls to overlap page titles. Product form rows stack on narrow screens.
- Replaced the full-screen mobile menu presentation with a compact, scrollable panel, a lighter backdrop and a sticky visible close control. Closing, Escape and following navigation links restore scrolling. Drawer entrance animation is disabled for reduced-motion users.
- Drawers and modals share a reference-counted scroll lock, preventing overlapping overlays from leaving the page unscrollable after closing.

Validation: monorepo build and TypeScript passed; 109 frontend tests passed, including inventory grouping, reserved stock, multi-page retrieval and overlapping scroll-lock lifetimes. Targeted lint for the new inventory/specification/mobile components has zero errors and one image optimization warning. The repository-wide lint command still fails on existing issues (16 API errors; 89 web errors, 145 warnings).

Playwright used the isolated fixture UI/API: editing Height and adding Edition persisted through the admin request and appeared on the dynamic product page; the three removed sections were absent. Category/franchise grouping, stock filters, search and stock adjustment passed. Product details and inventory were checked at 320, 375, 390, 768, 1024 and 1440px with no horizontal document overflow or uncaught page errors. Mobile drawer bounds, close button, Escape and scrolling after navigation passed. The product specification editor was also checked at 320px. Screenshots are in `output/playwright/refinement-2/`.

New frontend upload: `output/hostinger/HIMATU-Frontend-2026-11-10-Refinement-2.zip`. Its flattened standalone build passed separately. Redeploy it to **himatu.com**, retaining the existing environment variables and settings (Next.js, Node 22, root `./`, build `npm run build`, output `.next`). No API code changed in this follow-up, so the existing API deployment does not need to be replaced for these refinements. No production product records were modified, and the new frontend has not been deployed by the agent.

## Launch polish: identity animation and public copy

Implemented locally on 10 November 2026:

- Removed the descriptive paragraph beneath product titles on detail pages and in quick views. Product names, approved prices, specifications, photographs and purchase controls remain.
- Replaced the generic H tab icon with the supplied original `HIMATU-MAIN.png` through Next.js's file-based `icon.png` convention. The PNG was copied without editing its pixels; the old generic SVG was removed. Verified the metadata link and HTTP 200 PNG response.
- Replaced account-page photography with an original-PNG-based logo assembly. Four separately masked geometric pieces emerge, rotate and translate into the exact original mark. Six masked wordmark segments reveal in sequence, followed by a restrained light sweep and brief final illumination. GSAP owns the logo timeline; Motion handles editorial text transitions. No generated replacement logo, external font extraction or additional dependency was introduced.
- The sequence plays once when visible, pauses when hidden/offscreen, and offers replay/pause controls. Reduced-motion users receive the assembled identity immediately. Corrected a hydration mismatch discovered during reduced-motion testing by using a stable server snapshot for the media preference.
- Kept registration/sign-in controls, validation, password visibility, destination handling and account integration. No unsupported Google/Discord buttons were copied from the visual reference.
- Owner explicitly approved the currently configured source-photo product prices during this task. Price amounts were preserved and changed from illustrative to approved status. Removed the related demo price labels and draft-message suffixes. Stock remains independent: enquiry-only items do not receive invented stock claims. Website checkout remains unavailable for selections not present in the backend catalogue, with WhatsApp ordering retained.
- Removed customer-facing “demo” / demonstration copy across categories, informational pages, error states, authentication messages, checkout and contact. Internal storage keys and compatibility flags remain to preserve existing carts and data contracts.
- Replaced outdated claims that account forms, order flows and uploads do not submit data with descriptions of their implemented behavior. Information-page copy describes current data handling and order enquiries; it does not constitute a separate legal or launch-readiness certification.
- The contact form now prepares a WhatsApp enquiry containing the entered name, email and message, with a review/send link. It no longer validates locally while implying a functioning messaging service. Nothing is sent automatically.

Validation: build, TypeScript and 109 frontend tests passed. The final flattened Hostinger source package separately built successfully and verified its standalone runtime/assets. Full lint still fails on existing issues (16 API errors; 89 web errors, 146 warnings); targeted logo/form/copy lint has no errors and one image optimization warning.

Browser evidence: twenty public routes returned 200 and contained no rendered demo/demonstration wording. Sign-in, create-account and the Naruto keychain product were tested at 320, 375, 390, 768, 1024 and 1440px. Final responsive/reduced-motion sweep recorded no horizontal overflow or uncaught page errors. Logo final positions, replay, pause/resume, the static reduced-motion fallback and PNG icon passed. Authentication form response handling used intercepted mock requests; contact WhatsApp opening was intercepted. No real customer account, message, order, payment or catalogue mutation was created. Live email delivery and production authentication configuration were not certified by these UI tests.

Screenshots: `output/playwright/launch-polish/` (registration desktop/mobile, sign-in desktop/light theme, shape emergence, cleaned product).

Upload **`output/hostinger/HIMATU-Frontend-2026-11-10-Launch-Polish.zip`** to **himatu.com → Redeploy → Upload new files**, retaining existing environment variables and Next.js / Node 22 / root `./` / build `npm run build` / output `.next` settings. It includes all earlier refinements. No API code changed in this round. The archive excludes environment files, secrets, installed dependencies and build output, and its source matches the current repository. This round has not been deployed by the agent.

## Final upload: continuous logo animation

The owner requested automatic repetition without Replay. The logo sequence now loops indefinitely, with a 1.8-second settled pause between assemblies. Replay was removed. Pause/resume, offscreen/hidden-tab suspension and the reduced-motion static logo remain. Browser verification observed two complete automatic cycles, confirmed no Replay button, and checked pause/resume and reduced motion without uncaught page errors. The monorepo build, standalone frontend package build and 109 frontend tests passed.

Final uploads containing all changes:

- `output/hostinger/HIMATU-Frontend-2026-11-10-Final.zip` → `himatu.com`.
- `output/hostinger/HIMATU-API-2026-11-10-Final.zip` → `api.himatu.com`.

Both archives were checked against current source and exclude secrets/environment files. The backend source did not change in this last request; its archive matches the previously validated API package byte-for-byte. Keep the existing Hostinger settings and environment variables. These files have not been deployed by the agent.

## Checkout refinement: bKash and social ordering

Implemented on 10 November 2026:

- Checkout offers only bKash. Shared order validation, the API order/payment services and the frontend fallback reject other methods for new orders. Historical payment records and callbacks remain compatible.
- Highlighted the order CTA with a high-contrast raised magenta treatment, hover/press feedback, clear disabled states and mobile wrapping.
- New Address opens Profile → Addresses with the add form visible and focused. Saving from this flow returns to checkout; the new address defaults to primary unless unchecked. A return link is also available.
- Facebook and Instagram footer links use distinct blue and magenta backgrounds with white labels.
- Added Instagram ordering beside WhatsApp. Both channels use the identical formatted order, delivery details, bKash preference and totals. Instagram copies the message and opens `https://ig.me/m/himatuofficial`; the customer must paste and send it. Instagram does not support WhatsApp-style text prefilling through this link. If clipboard permission fails, a selectable message and copy control remain. Personal information is never placed in the Instagram URL. Updated checkout, FAQ, privacy and terms copy to describe these behaviors.

Validation: monorepo build and TypeScript passed; 185 tests passed (111 frontend, 74 API), with one opt-in database test skipped. Full lint remains blocked by existing repository issues (16 API errors; 89 web errors and 146 warnings). Both flattened Hostinger packages independently built and verified their runtime dependencies/assets. ZIP integrity, source matching and environment-file exclusion passed.

Isolated Playwright checks covered bKash-only selection, New Address → profile form → save → checkout, identical WhatsApp/Instagram messages, clipboard rejection fallback, and checkout at 320, 375, 390, 768, 1024 and 1440px without horizontal overflow. Address/order/session requests were fixtures and external chat openings were intercepted. No live customer, order, payment or message was created; live bKash processing and Instagram delivery were not certified. Screenshots: `output/playwright/social-checkout/`.

Latest upload packages (both must be redeployed):

- `output/hostinger/HIMATU-Frontend-2026-11-10-Social-Checkout.zip` → **himatu.com**. Keep Next.js, Node 22, root `./`, build `npm run build`, output `.next`.
- `output/hostinger/HIMATU-API-2026-11-10-Social-Checkout.zip` → **api.himatu.com**. Keep the current backend deployment settings and environment variables (output `dist`, entry `server.js`).

These packages include earlier refinements. No deployment was performed by the agent.


### White order button

Changed the checkout order CTA to white with black text, a neutral raised shadow and light-gray hover feedback. Disabled and responsive states remain. Updated frontend upload: `output/hostinger/HIMATU-Frontend-2026-11-10-White-Order-Button.zip`. Archive integrity and the packaged CSS match passed; backend unchanged.


### Dashboard light input fix

Scoped dashboard text/number/password/search inputs, selects and textareas to the light admin surface/text/border tokens. Native controls use a light color scheme independently of the storefront theme. Placeholder, caret, keyboard focus and disabled styles remain readable; checkbox/radio controls are not restyled. Browser fixture checks using actual CSS passed for six representative field types at 375/1440px with both inherited dark/light schemes. Screenshot: `output/playwright/admin-light-inputs.png`. Updated frontend ZIP: `HIMATU-Frontend-2026-11-10-Admin-Inputs-Fixed.zip`; backend unchanged.

## Product creation and photograph upload fixes

Implemented 10 November 2026:

- Fixed auto-generated product slugs freezing after the first typed letter. Slugs follow the full name while preserving manually chosen URLs. Generated SKUs now use random identifiers instead of a four-digit timestamp suffix.
- Added shared-schema validation before saving and persistent errors inside the product dialog. API Zod validation errors now return readable HTTP 400 messages rather than generic HTTP 500 errors. Entered fields and selected files remain available after a failed save.
- Multi-photo selections upload one image per request. This reduces request size through hosting proxies and reports the exact number saved when a later image fails. Completed photos reload in the image manager; remaining files can be retried without repeating successful uploads.
- Removed stale image-manager refresh state and cleared old upload errors when opening another product. Frontend product mutations no longer silently fall back to incomplete direct SQL/image handlers if the API is unavailable, or risk repeating a write after a lost response.
- Corrected fixed-width product search, statistics and photograph grids that caused dashboard overflow on mobile.

Validation: TypeScript and monorepo build passed. 115 frontend tests and 75 API tests passed; one opt-in database test skipped. The first API run was restricted from opening local test listeners; rerunning with listener access passed. Full lint still reports existing baseline issues (16 API errors; 89 frontend errors, 146 warnings). Final frontend and backend Hostinger source packages independently built and verified their runtime assets/dependencies. Archive integrity, source matching and environment exclusion were checked.

Browser checks used an isolated dashboard copy and in-memory API with a mock administrator: full-name slug generation, duplicate URL error displayed in the modal, corrected submission, two-photo creation, partial upload failure after one success, reloading saved photos, retrying only the remaining photo, and a storefront gallery with four persisted views. Dashboard/photo management passed 320, 375, 390, 768, 1024 and 1440px without document overflow. Screenshots: `output/playwright/product-create-error.png`, `product-created-with-images.png`, `product-upload-partial-mobile.png`, `product-upload-storefront.png`. Expected simulated HTTP failures were observed; the final storefront recorded no console errors.

A read-only check confirmed the configured Supabase `product-images` bucket exists, is public and accepts JPEG/PNG/WebP up to 10MB. No live product, image, user, payment or order was created. Deployed Hostinger environment settings and live authenticated writes remain to be verified after redeployment.

Redeploy both current packages while retaining environment variables:

- `output/hostinger/HIMATU-Frontend-2026-11-10-Product-Upload-Fixed.zip` → himatu.com (Next.js, Node 22, root `./`, build `npm run build`, output `.next`).
- `output/hostinger/HIMATU-API-2026-11-10-Product-Upload-Fixed.zip` → api.himatu.com (existing NestJS configuration, build `npm run build`, output `dist`, entry `server.js`).

### Actual localhost diagnosis

After the owner clarified the failure was on localhost, inspected listening services: frontend was running on port 3000, while configured API_URL pointed to localhost:4000 with no API process. Public catalogue browsing still returned data via the direct database fallback, hiding the missing service. Started the local API without stopping the existing frontend. API health returned HTTP 200 with database up; an unauthenticated product POST through the localhost frontend reached the API and correctly returned HTTP 401 (no product was created).

Updated root `npm run dev` to build shared contracts and launch both web and API. Added `dev:web` for separate-terminal use, preserved `dev:api`, and updated README. The launcher forwards frontend flags and stops its child process groups on shutdown. A fake-service smoke check verified both launches, argument forwarding and cleanup without disrupting the user's frontend. This development-command change does not alter the standalone Hostinger ZIPs. The local API was left running for the owner; no authenticated live catalogue write was performed.

### YouTube and TikTok

Added the supplied YouTube (@Himatuofficial) and TikTok (@otaku.vault.bd) links with platform icons to the footer and a follow section in checkout. Shared URLs also appear in the complete one-shot WhatsApp/Instagram order draft. These are follow links, not additional payment or automatic messaging providers. Existing bKash, WhatsApp and Instagram ordering behavior remains. TypeScript, seven order-message tests and the flattened frontend build passed. Updated frontend: `output/hostinger/HIMATU-Frontend-2026-11-10-Video-Socials.zip`; backend unchanged.
