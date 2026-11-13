# Storefront and invoice update — 12 November 2026

## Delivered

- Invoice layout follows the supplied reference: white A4 page, supplied HIMATU logo, billing details, invoice number/date, item/price/quantity/amount columns, delivery charge, order discount, total and amount due. Paid invoices show zero due.
- Administrators can prepare/review the invoice, download an actual PDF and approve email delivery. Email includes the same reviewed invoice as a PDF attachment and embeds the logo using a content ID. Existing stale-snapshot checks and duplicate-send protection remain.
- PDFKit generates documents in the API without a browser process. Long orders repeat the table header and move totals safely to a new page. The embedded logo comes from the supplied HIMATU signature; no external logo request is needed.
- Shop and category catalogues now show up to 16 products per page, arranged as four columns and four rows on desktop. Tablet/mobile layouts adapt to three/two columns. Search, sorting, filters, dynamic counts, URL pages and browser history remain. A loading race that reset direct page-two links to page one was fixed; page normalization now waits for the live catalogue. The storefront starts with a loading state instead of flashing old fallback listings, and provides a retry state if loading fails. Featured slideshows also show four figures on desktop.
- Original and sale prices are clearly labelled in product management. The previous list incorrectly crossed out the sale price; it now crosses out the original price. Red savings and selected-state accents are retained with brighter red text in dark mode.
- Checkout now submits a website request and displays confirmation/reference. It no longer displays social-channel selection, opens social apps or includes social icons in the order button. Social links remain in the footer, and direct product enquiries remain available.
- The order preview shows original subtotal, product discount and payable item total. The request snapshots original and sale unit prices; staff can see product savings while reviewing. Product savings are already reflected in sale unit prices and are not subtracted twice. Staff may separately configure an order-level discount before confirming the final order/invoice.
- Removed the hardcoded promotion-code example UI and excess checkout reassurance text. No shipping/payment method chooser is displayed. Delivery charge is confirmed before dispatch.
- Unbacked sample/reference products no longer merge into the live storefront. Former AI concept-only product routes are no longer published. Real database products, inventory, uploaded images and historical orders were preserved; no business records were deleted.
- The existing hero editor now starts with the actual four default slides and offers both original HIMATU photographs and uploaded product photographs. Administrators can replace, reorder, add/remove and save 1–8 slides at `/admin/content`.

## Category covers

All nine supplied Pinterest images were downloaded, visually inspected, rotated where necessary to make sideways artwork upright, and saved as optimized local WebP covers. Mapping:

- `650770214948182277`: Naruto.
- `1107533733400934728`: Attack on Titan.
- `912190099558322758`: Demon Slayer.
- `883831495602458809`: One Piece.
- `603834262588076707`: Katanas.
- `4606197358265142848`: Keychains.
- `1097752477961566647`: Jujutsu Kaisen.
- `1119566788644643282`: Dragon Ball.
- `751608625346020264`: Blue Lock.

Source URLs, dimensions and orientation changes are recorded in `apps/web/public/images/collections/sources.json`. These are supplied collection covers; they do not establish product inventory, authenticity or image licensing. Existing original product photography is unchanged.

Each collection/category detail page now starts with a wide cover above its heading. The katana image uses contain sizing so the blade stays visible. Other categories retain their existing covers and remain editable through category management.

The nine covers were also uploaded to the existing Supabase `product-images` bucket, under `collection-covers-20261112/`. Public availability was checked before the database image URLs were updated, so current deployed frontend versions can load them. The new full-width layout requires the updated frontend deployment. Original category settings are backed up in `SiteContent` under `covers-before-20261112`.

## Permanent owner

Per the user's confirmation, `davejoty009@gmail.com` is the single permanent owner. Ownership is stored as a profile UUID under the private `store-owner` SiteContent key, rather than inferred from an editable email or customer metadata. Future email changes do not transfer ownership.

Only this account can assign admin/moderator/customer roles. Neither the owner nor another administrator can demote or replace the owner through the role endpoint. Other administrators can still perform their existing operational responsibilities but cannot change staff roles. Moderators retain product, inventory and order-request access. The owner protection is enforced in the API transaction, not only through disabled form controls. If owner configuration is absent, role changes fail closed.

Migration `20261112090000_owner_and_collection_covers` was applied to the configured database, and the designated owner and nine category updates were verified. No roles on the other existing accounts were changed.

## Verification

- Monorepo production build passed.
- Strict TypeScript checks passed for API, frontend and shared package.
- 220 automated tests passed: 94 API and 126 frontend. One opt-in database test remains skipped.
- New tests cover owner authorization, owner immutability, direct website requests with original/sale prices, 16-item pagination and real PDF generation for short and long invoices.
- Playwright isolated Chromium checks passed for 16-item pages, four desktop columns, page URL/history, direct page-two entry/reload, red active-page indicator, search reset and zero results.
- Direct checkout fixture verified saved `website` channel, original/sale price snapshots, confirmation and no social popup. No real customer order was created.
- All nine cover images loaded. Category layouts checked at 320, 375, 390, 768, 1024 and 1440px without document overflow. Checkout checked at the same widths.
- Admin fixture checks passed for owner-only editing, editable default hero slides, request savings, invoice preview and PDF download. No real invoice email was sent.
- Sample A4 PDF rendered and visually inspected. A 50-line invoice produced five pages with final totals and page numbers intact.
- Both flattened Hostinger source packages built successfully. The packaged API production runtime generated a valid PDF after development dependencies were pruned. Next standalone runtime/public/static checks passed.
- Repository-wide lint was run and still reports existing baseline problems: API 16 errors; frontend 89 errors and 148 warnings. Changed API invoice/owner modules pass targeted lint. Existing lint errors remain in edited legacy frontend modules (`ProductCatalog` effect and `commerce-api` any types); no broad unrelated lint refactor was attempted.
- Browser checks used an isolated local copy with fixture authentication/API responses. Initial QA development-origin/hydration setup was corrected and the checks rerun. These are targeted Chromium checks, not full cross-browser certification or real email-delivery testing.

Screenshots and illustrative invoice artifacts: `output/playwright/nov12/`. Sample invoice customer/order data is fictional QA data.

## Deployment

Upload both updated packages: frontend to `himatu.com`, API to `api.himatu.com`. Keep existing production environment variables in Hostinger. Neither source ZIP contains credentials, node_modules or build output. The configured database migration and image storage update are already applied; a separate database should run the included Prisma migrations.

The code has not been deployed to Hostinger by the agent. Existing SMTP delivery limits remain those of the configured provider. PDFKit currently uses standard Helvetica text fonts; arbitrary non-Latin scripts require an appropriate embedded font before such invoices are supported.
