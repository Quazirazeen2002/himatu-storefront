# Handover QA — 14 November 2026

## Result

58 Chromium browser checks passed: 44 against the live storefront, and 14 against the corrected local production application connected to the actual API/database. Raw results are in `output/playwright/handover-live-results.json` and `handover-local-results.json`.

A new visitor started with zero cart items. Adding one item created one row. One item at quantity four and four distinct products were both exercised successfully. Existing legitimate cart selections persist across visits; no automatic four-product initialization was reproduced.

## Bugs corrected

- Successful checkout previously retained purchased products in the cart. Purchased quantities are now removed only after the API saves the request. Confirmation and the WhatsApp draft remain available. Failed submissions preserve the bag.
- Stale, deleted or unavailable saved products could contribute to an invisible cart count. The persisted bag is reconciled after a successful catalogue load, and the header counts visible catalogue items.
- Cart quantities could exceed available inventory. Store mutations, bag controls and detail controls now respect available stock, capped at ten.

## Browser coverage

Live checks covered fresh cart initialization, one item/quantity four, four distinct additions, increments/decrements, removal, persistence, guest checkout sign-in redirect, wishlist add/remove, search and empty results, pagination/back/forward, actual sale-price sorting, mobile menu/scroll restoration, representative product and collection banners, fifteen public routes and shop widths 320, 375, 390, 768, 1024 and 1440. No uncaught page errors were recorded in the route sweep. The initial CDN browser challenge resolved before testing.

The local production browser used a dedicated confirmed customer QA account. Actual sign-in and authenticated checkout worked. A browser-only simulated 503 verified bag retention; a real QA request verified successful persistence, order reference, WhatsApp message delivery charge of BDT 135 and total, cart clearing and reload. No WhatsApp message was sent. Continuous field typing and 320px checkout overflow checks passed. Browser-only stock fixtures verified clamping and disabled increment controls without changing inventory. A customer was refused access to the admin product API.

Screenshots: `output/playwright/handover-live-home-mobile.png`, `handover-local-order-confirmation.png`, `handover-local-checkout-mobile.png`.

## Automated verification

- Main frontend production build and separate Hostinger package build passed.
- TypeScript checks passed.
- 13 focused frontend tests passed, covering cart lifecycle, catalogue mapping and request idempotency.
- 39 targeted backend tests passed across shopping, categories, social-order boundaries/enrollment, invoice delivery and owner roles. Server-binding tests required execution outside the filesystem sandbox.
- Targeted lint on the changed cart/store/checkout files passed. The project has existing broader lint failures recorded in previous validation; this work does not claim a clean repository-wide lint result.

## Authorized launch reset

After testing, the owner-requested reset removed 5 orders, 8 order lines, 20 order requests, 4 invoices, 1 payment transaction, 2 payment events, 445 analytics events and 256 analytics insights. No refunds existed. A transaction and checksums verified that products, product images, inventory, categories and accounts were unchanged during reset.

Private recovery backup: `/private/tmp/himatu-pre-handover-reset-2026-11-14.json` (local permissions 0600; contains private order data; not included in any ZIP). Reset counts: `output/playwright/handover-reset-result.json`. New real browsing will begin producing analytics again. The temporary QA account and its credentials were removed separately after testing.

## Deployment and scope limits

Deploy `output/hostinger/HIMATU-Frontend-Cart-QA-2026-11-14.zip` to himatu.com using the existing working settings: Other / Node.js, Node 22.x, build `npm run build`, output `dist`, entry `server.js`. Keep existing environment variables. No backend code change was needed for these cart fixes.

These checks do not certify every feature or browser. Real product create/edit/delete and live image uploads were not exercised because the owner required the existing real products to remain untouched. Staff UI workflows, invoice email delivery, signup email verification, external WhatsApp Send and cross-browser accessibility remain outside this browser run; relevant backend permissions/invoice behavior were covered by automated tests. The cart fixes were verified locally and packaged, but have not yet been deployed to the live site.
