# Stage 2 visual refinement completion report

Completed 8 November 2026 (Asia/Dhaka).

## Outcome

Refined the existing Next.js storefront in place. The application retains its routes, original HIMATU photographs, browser-persistent demo bag/wishlist, search, filters, checkout validation, custom printing form and light/dark toggle. No backend or production commerce integration was introduced.

The active design combines bold Barlow Condensed display typography, Inter interface typography, Geist Mono metadata, a dark default palette, original collectible photography and simplified editorial composition. The catalogue now contains seven existing figure records plus three clearly disclosed original AI concepts, paginated into nine entries followed by one.

## Typography and visual changes

Self-hosted Barlow Condensed 800 italic powers hero/campaign/page headlines and the HIMATU watermark. Barlow 700 normal supplies section headings. Inter uses 500 body, 600 navigation and 700 product titles/buttons. Geist Mono remains the metadata face. Fontsource packages and original SIL OFL notices are included locally; no proprietary Nike or Anthropic font was extracted. Historical serif files remain archived but are no longer loaded.

Dark tokens are background #000000, surface #0A0A0A, elevated #111111, border #262626, primary #FFFFFF, secondary #A0A0A0, muted #737373 and accent #D92727. Primary CTAs are white with black text. Existing light preference remains available from the header and persists on reload. Typography scales with clamp(), with distinct body, heading and metadata weights.

Homepage changes: the oversized decorative COLLECT. watermark is now HIMATU; the headline reads YOUR FANDOM. YOUR COLLECTION.; SHOP NOW links directly to the catalogue. The homepage now flows through six genuine featured figures, franchise discovery, the custom printing editorial section and DISCOVER. COLLECT. DISPLAY. Duplicate product/editorial sections and unsupported new-arrival claims were removed. Missing franchise imagery uses distinct typographic monograms with an honest photography-pending label.

Product grids use stronger Inter titles, large consistent 3:4 photographs, subtle wishlist controls, clear sample-price/stock disclosure and quieter borders. Header links are Shop All, Collections, New Arrivals and 3D Printing, with the existing utility controls and simple collection dropdown. Active navigation, focus, disabled states, dialogs and forms share the visual system.

## Original AI concept assets

Generated with the built-in image_gen tool in three separate generation requests, then optimized locally with Sharp to WebP without changing the 1086×1448 aspect ratio. Generation used professional collectible product-photography composition, realistic painted resin/PVC appearance, neutral dark studios, consistent three-quarter camera framing, complete bases and original fictional character designs.

- `public/images/concepts/aether-forged-swordsman.webp`: bronze/slate armored fantasy swordsman, ivory sculpted fabric and engraved sword; approximately 148 KiB.
- `public/images/concepts/celestial-wayfarer.webp`: silver-haired celestial warrior, elaborate blue/gold costume and dramatic display pose; approximately 202 KiB.
- `public/images/concepts/veiled-shadow-fighter.webp`: masked fighter, layered charcoal/plum clothing and sculpted base; approximately 163 KiB.

Exact generation prompts and tool mode are preserved in [provenance.json](../public/images/concepts/provenance.json). Descriptive alt text is defined in `src/lib/assets.ts`. The concepts have individual existing-pattern `/products/[slug]` pages and appear in Other Collections, catalogue search, filtering, wishlist and recently viewed.

Each is labelled **AI-GENERATED CONCEPT — NOT FOR SALE**. No concept has a price, stock state, manufacturer or physical product specifications. Concept detail pages omit Add to Bag and Buy Now. The discriminated data union and store sanitization prevent concept IDs entering bag totals or checkout, including manually modified storage. Wishlist saving is permitted as visual inspiration.

The seven original HIMATU JPEGs were preserved byte-for-byte. SHA-256 evidence is in [photo-integrity.json](../output/playwright/visual-refinement/photo-integrity.json). Existing figure names, descriptions, sample prices and availability fixtures remain intact.

## Catalogue pagination

`discover()` applies combined filters and sorting before the shared `paginate()` helper slices the results. PAGE_SIZE is nine. Counts, ranges, numbered controls and boundaries derive from actual filtered length. Current totals are ten, not the example total in the brief.

URL parameters store search, universe, minimum/maximum price, availability, type, sorting, new-arrival scope and page. Native history integrates with Next.js useSearchParams. Page navigation preserves filters; changing filters or sorting resets to page one. Search replaces the current history entry while typing; discrete filters/sort/page actions push entries. Browser back/forward, direct page URLs, stale-page clamping, zero results and mobile controls were verified.

Unpriced concepts sort after priced figures and are excluded by price or availability restrictions. Collection scope stays locked. Verified new arrivals are currently unavailable, so the New Arrivals destination shows an explicit empty state rather than relabelling existing fixtures.

## Validation

- `npm run build`, `npm run typecheck`, `npm run lint`: passed; lint has no warnings.
- All 35 content routes × six requested widths: 210 checks passed, HTTP 200, one settled h1 and no horizontal overflow.
- Four legacy product redirects and expected missing-product 404 passed.
- Pagination boundaries, 9/1 split, counts, back/forward, search/sort resets, query preservation, invalid page clamping and empty results passed.
- Franchise, price, type and availability discovery, plus mobile filtering/pagination, passed.
- Concept purchase safeguards, concept wishlist persistence, original-figure bag feedback and persisted quantity passed.
- Checkout required-field checks and five-step review, authentication validation/password toggles and custom printing validation/local image preview passed.
- Mobile dialog focus/Escape return, header search, light-theme persistence and reduced-motion behavior passed.
- All seven original photo hashes match. Final screenshot images loaded, with no failed assets, uncaught page errors or console errors during capture.
- Active font faces were verified loaded. Desktop/mobile home, catalogue, product, bag, checkout and concept layouts were visually reviewed.

The expected 404 probe creates a browser resource error only for that intentionally missing URL. The first route sweep needed a settled-heading wait for one streamed transition; the final sweep passed. Screenshot capture was adjusted to use immediate scrolling so the existing reveal animations appeared in full-page images. These were verification adjustments, not application defects.

Detailed evidence: [responsive testing](responsive-testing.md), [route audit](../output/playwright/visual-refinement/route-audit.txt), [interaction audit](../output/playwright/visual-refinement/interaction-audit.txt), [form audit](../output/playwright/visual-refinement/form-audit.txt), [screenshot audit](../output/playwright/visual-refinement/screenshot-audit.txt), [active font and footer check](../output/playwright/visual-refinement/font-and-footer-audit.txt).

## Before and after screenshots

All requested screenshots are local full-page PNGs. Desktop is 1440px wide; mobile is 390px. The bag and checkout use the same two-item demo bag in both versions.

- Homepage desktop: [before](../output/playwright/visual-refinement/before/home-desktop.png) · [after](../output/playwright/visual-refinement/after/home-desktop.png).
- Homepage mobile: [before](../output/playwright/visual-refinement/before/home-mobile.png) · [after](../output/playwright/visual-refinement/after/home-mobile.png).
- Shop page one: [before](../output/playwright/visual-refinement/before/shop.png) · [after](../output/playwright/visual-refinement/after/shop-page1.png).
- Shop page two: [after](../output/playwright/visual-refinement/after/shop-page2.png). No baseline exists because pagination was newly added.
- Product detail: [before](../output/playwright/visual-refinement/before/product.png) · [after](../output/playwright/visual-refinement/after/product.png).
- Shopping bag: [before](../output/playwright/visual-refinement/before/bag.png) · [after](../output/playwright/visual-refinement/after/bag.png).
- Checkout: [before](../output/playwright/visual-refinement/before/checkout.png) · [after](../output/playwright/visual-refinement/after/checkout.png).
- Additional evidence: [AI concept detail](../output/playwright/visual-refinement/after/concept-detail.png).

## Documentation and implementation locations

Updated `docs/design-system.md`, `docs/product-discovery.md`, `docs/responsive-testing.md` and font provenance. Added this report. Main implementation locations are `src/app/refinement.css`, `src/lib/tokens.css`, `src/app/layout.tsx`, `src/lib/catalogue.ts`, `src/lib/discovery.ts`, `src/lib/types.ts`, `src/lib/assets.ts`, `src/lib/demo-store.ts`, shared campaign/header/collection/product components and the existing homepage/shop/product/collection routes.

## Remaining limitations

Existing real-photo figure prices and availability remain demonstration fixtures awaiting business approval. No verified new-arrival data or additional franchise photography was supplied. AI imagery represents fictional visual concepts only, not licensed stock or manufactured products. The commerce, authentication and inquiry flows remain frontend demonstrations; no payments, orders or messages are sent. Validation is Chromium-focused and does not certify every browser, assistive technology or real mobile device.
