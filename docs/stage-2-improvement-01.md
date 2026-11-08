# Stage 2 Improvement 01 — typography and dark theme

Completed 7 November 2026 (Asia/Dhaka).

## Changes

Presentation-only update to the existing application: local Figtree UI/body type, regular Source Serif 4 editorial headings, Geist Mono metadata, and the requested dark palette across all pages, forms, dialogs, galleries and commerce views. No application rebuild, new runtime dependency, generated product artwork or image filtering. Font licenses and provenance are in `src/app/fonts/`. See [the design system](design-system.md).

Changed source: `src/lib/tokens.css`, `src/app/globals.css`, `src/app/theme.css`, `src/app/layout.tsx`, plus three local WOFF2 files and their license notices. Product/commerce components and data remain untouched.

## Validation

- `npm run build`, `npm run typecheck`, `npm run lint`: passed.
- 36 existing route entries (32 content routes and four retained demo redirects) × six widths (320, 375, 390, 768, 1024, 1440px): 216 checks passed. No horizontal overflow and all settled pages had one h1.
- 32 internal link destinations checked: no broken destinations. No page/console errors or failed asset/font responses in the route sweep.
- Browser confirmed Figtree, Source Serif 4 and Geist Mono loaded locally; hero regular weight 400, UI Figtree, metadata Geist Mono, body background #000000 and white/black primary buttons.
- Targeted computed-text contrast checks on ten representative routes found no failures. Primary/secondary foreground pairs and control-border contrast are documented in the design system. This is targeted Chromium QA, not full screen-reader/cross-browser accessibility certification.
- Search, price sorting, mobile availability filters, header search, mobile modal focus/Escape, photo zoom, cart quantity/persistence, wishlist persistence, full five-step demo checkout, sign-in validation and reduced motion passed.
- SHA-256 checks confirmed all 15 protected files unchanged: catalogue/types, seven original figure JPEGs, store/discovery modules and core cart/checkout/action/provider code.
- Baseline and after screenshots use the same example bag: two Luffy figures, illustrative subtotal ৳13,000, with Zoro saved to the wishlist. No real purchase or payment occurs.

## Before and after screenshots

Full-page captures are available for all five requested views at desktop 1440×1000 and mobile 390×844. The viewport dimensions are fixed; full-page screenshot height follows content. Fonts were allowed to load and scroll reveals were triggered before capture.

### Desktop

- Homepage: [Before](../output/playwright/dark-theme/before/desktop/homepage.png) · [After](../output/playwright/dark-theme/after/desktop/homepage.png)
- Shop: [Before](../output/playwright/dark-theme/before/desktop/shop.png) · [After](../output/playwright/dark-theme/after/desktop/shop.png)
- Product: [Before](../output/playwright/dark-theme/before/desktop/product.png) · [After](../output/playwright/dark-theme/after/desktop/product.png)
- Cart: [Before](../output/playwright/dark-theme/before/desktop/cart.png) · [After](../output/playwright/dark-theme/after/desktop/cart.png)
- Checkout: [Before](../output/playwright/dark-theme/before/desktop/checkout.png) · [After](../output/playwright/dark-theme/after/desktop/checkout.png)

### Mobile

- Homepage: [Before](../output/playwright/dark-theme/before/mobile/homepage.png) · [After](../output/playwright/dark-theme/after/mobile/homepage.png)
- Shop: [Before](../output/playwright/dark-theme/before/mobile/shop.png) · [After](../output/playwright/dark-theme/after/mobile/shop.png)
- Product: [Before](../output/playwright/dark-theme/before/mobile/product.png) · [After](../output/playwright/dark-theme/after/mobile/product.png)
- Cart: [Before](../output/playwright/dark-theme/before/mobile/cart.png) · [After](../output/playwright/dark-theme/after/mobile/cart.png)
- Checkout: [Before](../output/playwright/dark-theme/before/mobile/checkout.png) · [After](../output/playwright/dark-theme/after/mobile/checkout.png)

Additional dark mobile views: [navigation](../output/playwright/dark-theme/after/mobile/navigation.png), [search](../output/playwright/dark-theme/after/mobile/search.png), [bag drawer](../output/playwright/dark-theme/after/mobile/bag-drawer.png).

## Preserved boundaries

All original product photographs and catalogue information/prices remain unchanged. No routes or commerce logic were altered. Existing demo labels and Stage 3 backend requirements remain. The only minor new photographic treatment is an opaque background behind small overlay captions; the actual product image pixels and figure details are unaffected.

The original Stage 2 report and photography follow-up remain historical records. Current visual tokens and typography are documented in `design-system.md`.

Final caption refinement: the homepage was rechecked at all six widths after adding the opaque caption backing; no overflow. Desktop/mobile homepage after captures were refreshed against the final build. The computed caption background is #0A0A0A.
