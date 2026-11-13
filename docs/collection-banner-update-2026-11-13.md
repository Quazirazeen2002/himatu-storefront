# Collection banners and category editor

The category editor now scrolls inside its modal at desktop and mobile heights. The dialog title stays visible while the lower controls and Save button remain reachable.

Franchise and product-category landing pages now use a full-width banner with the collection name and an Explore button at the bottom center. The button scrolls to the product list. The breadcrumb sits on the banner so the first viewport focuses on the collection art. Franchise banners use a wide crop with a dark lower overlay for readable text; the Naruto mobile focal point was adjusted to keep his head visible. Product-type banners use `contain` so portrait merchandise covers are not cut off. The existing nine covers supplied through Pinterest remain in place. YouTube footer buttons are red.

Eight previously figurine-backed franchise banners now use locally stored anime or comic artwork. Seven cosplay, convention, and cinema photos were replaced with illustrated wallpapers that match their collection names. The Solo Leveling visual remains the [official anime artwork](https://sololeveling-anime.net/assets/img/top/visual3.jpg). The downloaded wallpapers were converted to compact WebP files; their source URLs and dimensions are listed in [`banner-sources.json`](../apps/web/public/images/collections/banner-sources.json). **Commercial reuse rights have not been verified for these wallpapers or for the nine owner-selected Pinterest covers** in [`sources.json`](../apps/web/public/images/collections/sources.json). Clear those rights or replace the artwork with licensed assets before public deployment.

The banner mapping applies only to the default collection cover path or its new local wallpaper path. A cover changed by an admin takes precedence. Product data and product photos were not changed.

## Verification

- Monorepo web production build and flat Hostinger frontend build passed, including TypeScript.
- Targeted ESLint and `git diff --check` passed.
- All 15 franchise landing URLs returned HTTP 200 in the production preview.
- Chromium: verified banner image loading, CTA anchor, light-theme contrast, red YouTube button, and no overflow at 320px and 375px.
- A phone-height dialog with long category fields scrolled to its Save button. This verifies the modal's browser layout; a signed-in admin save was not run in the isolated preview.
- The isolated preview had no API server, so its auth and catalogue fetches returned 503. These are preview-environment responses, not banner asset failures.
- Screenshots: [`collection-desktop.png`](../output/playwright/nov13/collection-desktop.png) and [`collection-mobile.png`](../output/playwright/nov13/collection-mobile.png).
