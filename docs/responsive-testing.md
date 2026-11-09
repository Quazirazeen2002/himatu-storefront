# Stage 2 responsive and frontend testing

Final visual-refinement test date: 8 November 2026 (Asia/Dhaka). Chromium through the Playwright CLI against the local production build at port 3001.

## Build checks

- `npm run build`: passed, production compilation and static generation completed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings or errors.

## Routes and responsive layout

All 35 content routes were navigated at 320, 375, 390, 768, 1024 and 1440px: **210 combinations passed**. Every settled page returned HTTP 200, contained exactly one h1 and had no document horizontal overflow. This includes the three new concept detail pages and all existing informational/customer routes. Four retired product slugs still redirect to their associated collections. An unknown product returned the expected 404.

The first sweep sampled one collection while streamed content was transitioning and observed two h1 elements. The final sweep waits for settled heading structure and passed without a source change. No uncaught page errors or failed asset responses occurred in the final content sweep. The intentional missing-product check produces an expected 404 resource console message; it is not counted as an application asset failure.

See `output/playwright/visual-refinement/route-audit.txt`.

## Discovery and interaction checks

Pagination was verified as nine entries on page one, one on page two, accurate 1–9/10–10 ranges, disabled boundary controls, active page state, native browser back/forward and stale page clamping. Search and sorting reset page one; page navigation preserves search. Franchise, price, availability and concept-type filters were exercised. Price ordering was checked, unpriced concepts stay outside price-filtered results, zero results show 0–0 of 0, and New Arrivals shows the honest empty state. Mobile page two and mobile filter resets passed at 320px.

Concept disclosure and absence of price/purchase actions passed. Saving a concept to wishlist survived reload. A manually seeded concept bag ID was rejected during storage sanitization. Adding an original figure opened the bag drawer; quantity updates survived reload. Checkout required-field validation passed and the five-step flow reached local review using example details.

Sign-in and registration required-field checks, password visibility and local-only status messages passed. Custom printing required-field validation, local image preview and successful local validation passed. Mobile navigation received focus, closed with Escape and returned focus to the trigger. Header search found the new concepts. The light theme persisted after reload, then was switched back to dark. Reduced-motion emulation disabled hero animation.

Evidence: `interaction-audit.txt` and `form-audit.txt` in the same output directory. The broader pagination/history checks are also recorded in the Playwright CLI execution history.

## Images, fonts and visual review

All seven original JPEGs matched their starting SHA-256 hashes. All images in the seven requested final captures loaded successfully; no overflow, page errors, console errors or failed responses occurred during capture. The active Inter, Barlow 700 normal, Barlow 800 italic and Geist Mono faces were confirmed loaded. An initial FontFaceSet check included the unused Barlow fallback face; the subsequent exact-family check confirmed the actual display face loaded.

Before/after screenshots cover the homepage desktop/mobile, shop, product, bag and checkout; page two and an additional concept detail screenshot document new states. Screenshots use 1440×900 desktop and 390×844 mobile viewports, full-page capture, dark mode and a consistent seeded demo bag containing two Luffy figures. Scroll reveals were triggered with immediate scrolling before capture, and images were allowed to finish loading. Home desktop/mobile, catalogue, product, bag, checkout and concept detail were visually reviewed.

## Scope

This is targeted Chromium validation, not cross-browser or screen-reader certification. No production inventory, authentication, payment or order service exists. Existing sample prices/states require business verification. Missing franchise photography remains disclosed. Keyboard/modal focus and contrast treatments were checked selectively; a complete assistive-technology audit remains future work.

## Collectible refinement — 9 November 2026

Tested homepage, shop, an existing figure detail, a new AI concept detail, bag and checkout in dark/light themes at 320, 375, 390, 768, 1024 and 1440px: 72 combinations. Final sweep passed with no document horizontal overflow. Catalogue controls now wrap within the available width; checkout grid children and inputs can shrink at 320px. Featured purchase rows wrap with deliberate spacing between prices and buttons. Both new editorial sections adapt to a single column on mobile.

Checked making-of autoplay, play/pause, manual chapters and reduced motion; concept purchase exclusion; expanded pagination; sale-aware bag/checkout totals; original-price restoration after discount removal. Browser checks ran in an isolated UI preview with unchanged production auth rules, then forwarded real API product responses for sale-total verification. Screenshots are under `output/playwright/collection-refinement/`. These are targeted Chromium checks, not cross-browser certification.

## HIMATU story — 9 November 2026

The six-letter section passed 24 combinations: six widths (320, 375, 390, 768, 1024, 1440px), dark/light themes and normal/reduced motion. Desktop pinning is enabled only from 1100×700px on eligible devices. Narrow, short, reduced-motion and Data Saver layouts retain the narrative without ScrollTrigger pinning or scrubbed transforms. Detail controls and grouped display work in both desktop and inline mobile presentations. A clipped heading found during a motion-mode transition was corrected with GSAP property cleanup and static visibility safeguards; the entire sweep passed after the fix.

Native chapter anchors work with keyboard activation. Personalized collection selection updates the closing link. Repeated client-side navigation and desktop/mobile switching leave no duplicate pin wrappers. Desktop/mobile image captures were visually reviewed. The scroll recording is `output/playwright/himatu-story/scroll-demo.mp4`. This was isolated Chromium UI QA with mocked account/catalogue responses, not cross-browser or production-authentication certification.

## Category taxonomy — 9 November 2026

The category update passed root production build and strict TypeScript checks. Category service/schema and independent-filter tests were added. Repository-wide lint still reports pre-existing failures: 18 API errors and 100 web errors (159 warnings); targeted category UI lint passes. `git diff --check` passes.

Chromium checks covered homepage, category gallery, Keychains, anime gallery, Bleach and shop at 320, 375, 390, 768, 1024 and 1440px in both themes: 72 combinations without document overflow. The final four-family gallery addition was checked again at all six widths in both themes. Combined product-category/franchise filtering, page reset and browser Back preservation passed. All eleven anime cards are present. Desktop/mobile final captures were visually reviewed after images loaded.

The live API returned five product types and eleven anime franchises. Independent product-type/franchise queries and the product-type category endpoint returned correct assignments; unauthenticated admin listing returned 401. A temporary category was created through the category service, given an actual storage upload, read through the public API and rendered by the dynamic route without rebuilding. Editing and hiding it worked; the hidden page rendered Next's not-found/noindex result (streamed HTTP status may remain 200). The temporary database row and uploaded object were removed afterward. Admin create/edit UI was additionally exercised with an isolated administrator fixture, including a partially typed cover URL.

UI tests used an isolated production source preview with its auth proxy omitted and account responses mocked; live category/product API requests were forwarded. Production authentication was unchanged. These are targeted Chromium and service integration checks, not certification of every authenticated customer journey or cross-browser accessibility. The database integration test suite remains skipped without `TEST_DATABASE_URL`.

Final screenshots: `output/playwright/taxonomy/product-categories-1440.png`, `product-categories-390.png`, `anime-collections-1440.png`, `anime-collections-390.png`, `keychains-demo-1440.png`, and `keychains-demo-390.png`. `admin-categories.png` shows the isolated admin fixture rather than a production account.

Final sequential test run: 69 API tests and 92 web tests passed (161 total), with one database integration test skipped. An earlier run overlapped Prisma generation/type validation and reported transient generated-type diagnostics; the isolated sequential rerun passed all applicable suites.

## Original photography and WhatsApp ordering — 9 November 2026

Root build passed, followed by the final web production build after the last component edits. Root strict typecheck and `git diff --check` pass. Tests: 69 API and 96 web tests pass (165 total); one database integration test is skipped without a configured test database. New tests verify the international WhatsApp recipient, URL encoding, complete customer/item data, totals, optional fields, category coverage and exclusion of unpriced source references from the payable bag.

Seventy content routes returned HTTP 200 in the isolated preview, including all 25 active products, archived concept detail URLs, product category and franchise routes, and existing informational/authentication page foundations. All 34 locally downloaded/optimized source photos returned HTTP 200 with image content types. The final desktop/mobile screenshot set had no unloaded visible images. The desktop shop grid was confirmed to have three computed columns.

Normal-motion tests confirmed hero auto-advance, hero image drift and featured slide movement while hovered. Quick view opened, adding a known in-stock figure closed it and updated the persisted bag. Mobile category navigation, bag drawer opening/Escape dismissal and saving a sourced Naruto entry to wishlist passed. A reduced-motion hydration mismatch in the featured pause control was corrected using `useSyncExternalStore` with a stable server snapshot. The subsequent reduced-motion reload recorded no console errors; hero/featured slides stayed still and hero drift was disabled.

WhatsApp QA used dummy contact details and intercepted `window.open`. Required-field validation prevented opening an invalid request. A valid request contained the full form and selected discounted products, opened exactly once even on a rapid double-click, targeted `8801797725697`, and retained the bag. FREESHIP correctly produced zero delivery cost in the message. No WhatsApp message, real payment or database order was submitted.

Screenshots: `output/playwright/original-photo-refinement/` contains desktop/mobile homepage, shop page two, original Luffy detail, sourced Naruto detail, mobile category gallery, the photo-free HIMATU story, the original-photo making-of section, and the formatted WhatsApp checkout. Final captures wait for hydration/fonts/images; development overlays are hidden only in the screenshot preview. Third-party photo provenance is in `apps/web/public/images/sourced/sources.json`.

Repository-wide lint still reports 18 API errors and 98 web errors (156 warnings) in existing unrelated code. Targeted ESLint checks for all changed campaign, slideshow, product, checkout and mobile-dock components pass. The auth proxy was omitted only in an isolated source copy, with account responses mocked and live product/category reads forwarded to the local API. These checks do not certify production authentication, payment processing, cross-browser behavior or screen-reader accessibility.

Final responsive sweep: seven representative routes × six widths × two themes = 84 combinations passed without horizontal overflow or console errors. This final sweep used reduced motion; normal-motion autoplay and scroll interactions were checked separately. Measurements wait for viewport resize, animation frames and React breakpoint updates to settle. An earlier immediate-resize probe reported transient widths; settled-layout checks and the rerun passed.

## Cart plus direct WhatsApp follow-up — 9 November 2026

Reference products now support cart quantity selection and persistence alongside direct WhatsApp enquiries. Frontend build, strict typecheck, targeted lint and all 97 frontend tests pass. Mixed-cart browser checks confirmed both priced and unpriced items appear in checkout, unknown prices are marked for quoting, the WhatsApp draft includes all lines, and payment checkout is blocked until prices are confirmed. Product detail, bag and checkout passed 12 settled viewport checks at 320, 390, 768 and 1440px without overflow. Browser QA used the same isolated preview and did not send any WhatsApp messages. The follow-up supersedes earlier bag-exclusion tests for reference products; AI concepts remain excluded.

## Numeric demo-price follow-up — 9 November 2026

Frontend production build, strict typecheck, targeted lint and all 97 frontend tests pass. Updated tests cover positive demo prices, price filtering, mixed-cart arithmetic and labelled numeric WhatsApp totals. Chromium confirmed Naruto at ৳3,290, both cart/direct enquiry controls, a mixed subtotal of ৳12,105 and estimated delivered total of ৳12,185. Pending-quote wording was absent from the checked product/cart/checkout/draft flow. Checkout passed 320, 390, 768 and 1440px without overflow. Browser verification intercepted the WhatsApp window; nothing was sent.
