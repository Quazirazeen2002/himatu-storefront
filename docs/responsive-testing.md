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
