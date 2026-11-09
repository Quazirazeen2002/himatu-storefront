# Original photography and WhatsApp ordering

Implemented 9 November 2026 (Asia/Dhaka).

## Storefront changes

The HIMATU scroll narrative retains GSAP letter/chapter animation and Motion interactions. Its desktop and mobile photographic panels were replaced with typographic letter studies. The homepage concept-lab section was removed. The original seven AI concept detail URLs remain accessible for compatibility, but those concepts are excluded from the active shop catalogue.

The hero combines automatic photo transitions with restrained image drift. Featured collectibles advance automatically, including during pointer hover. Both retain pause controls, keyboard focus safeguards and reduced-motion behavior. The making-of section now uses the owner's original Zoro photograph; its caption identifies the sequence as a stylized process illustration rather than actual manufacturing footage.

Product copy now has a larger lead paragraph, a prominent character name, a compact status line and expandable provenance details. Luffy Gear Five Action has revised editorial copy. Existing original prices and the owner-approved 15% sale pricing remain intact. Catalogue pagination still allows nine entries per page, with three desktop columns.

## Photography and catalogue

Seventeen real-photo reference products cover the five product categories and all requested named franchises. Sources are Good Smile Company, Bandai/Tamashii Nations and ABYstyle/Abysse Corp. Thirty-three optimized WebP photographs support these entries; a further original Straw Hat emblem pin photograph corrects the existing pin entry's previously unrelated Luffy image. Original uploaded figure files were preserved.

Source page URLs, original image URLs and SHA-256 hashes are recorded in `apps/web/public/images/sourced/sources.json`. The source watermarks and copyright notices were preserved. Images were resized/encoded without generating replacement artwork. Third-party photographs remain owned by their respective rights holders; downloading and attribution do not establish a commercial reuse licence. Obtain the appropriate reuse clearance before public commercial launch.

The active catalogue now contains eight existing priced entries and seventeen reference entries. Each new reference has a product route, gallery, franchise/category filters, wishlist and WhatsApp enquiry. No local price, stock quantity or manufacturer specification was invented for these references. They cannot enter the payable bag; HIMATU must confirm supply and local prices first. The existing local catalogue/API-membership boundary remains: these reference entries are local catalogue data, not new database inventory.

Eighteen previously generated category template covers were replaced in the live category database. The update script only matches the original generated template paths, preserving subsequent custom admin uploads. It backs up the cover fields before updating them and does not modify products, prices or inventory. Future cover management remains available in Admin → Categories.

## Useful reference-store features

Reviewed `https://teesotshop.com/` through its actual page and browser UI. Adapted its quick-view pattern and mobile shopping shortcuts into HIMATU's existing visual system, without copying its branding, testimonials or code. Quick view supports details, wishlist and existing purchase/enquiry actions. Adding from quick view closes the dialog so the bag feedback is visible. The mobile dock links Home, Categories and Wishlist and opens the existing bag drawer with its current quantity.

## WhatsApp checkout

WhatsApp is the default order channel; existing website checkout remains selectable. A valid form opens a draft addressed to `8801797725697` (01797725697). The single message contains product names, characters, quantities, current unit prices and line totals, subtotal, extra discount when applied, delivery estimate, estimated total, name, email, phone, complete delivery address, postal code when provided, shipping/payment preferences and optional delivery notes.

The customer reviews the prefilled message and presses Send in WhatsApp. The UI does not send automatically, charge payment, create a database order or claim confirmation. The bag remains saved. Rapid repeated submission is guarded; a visible Open WhatsApp link and Copy Message control provide a fallback if the browser blocks the popup. Editing form values clears the prepared draft. The draft is component state only and is not saved to local storage. The customer is told which personal details will be shared before proceeding.

Existing shipping values are presented as estimates subject to confirmation. The pre-existing FREESHIP promo now correctly affects the displayed shipping and draft totals. Unverified courier/authenticity guarantees were removed from the touched checkout copy.

## Validation

Root build and TypeScript checks pass. Tests pass: 69 API and 96 web tests, 165 total; one database integration test is skipped without `TEST_DATABASE_URL`. New tests cover message encoding, recipient, complete form/item data, monetary totals, optional fields, category coverage and purchase exclusion for unpriced reference entries.

Targeted ESLint checks pass for the changed story, slideshow, product, checkout and mobile-dock components. Repository-wide lint still has existing unrelated failures; see the final validation notes in `docs/responsive-testing.md`.

Browser QA uses an isolated source preview with its auth proxy omitted, account responses mocked and category/product reads forwarded to the live local API. Production authentication remains unchanged. The WhatsApp test intercepts `window.open`: no message was sent and no real order/payment was created. The existing website payment flow was preserved but not exercised with a live transaction.

Screenshots are in `output/playwright/original-photo-refinement/`. This is targeted Chromium validation, not cross-browser certification.

## Follow-up: retain both cart and WhatsApp actions

Reference listings now have Add to cart above the direct WhatsApp enquiry. Quantity selection, saved bag state, drawer display, removal, quick-view feedback and checkout include these items. Unknown prices are explicitly awaiting a quote. Mixed WhatsApp requests include both priced and unpriced lines; no fabricated total is shown. The direct enquiry link includes the selected quantity. The earlier statement that references cannot enter the bag is superseded by this follow-up; website payment remains unavailable while any cart item lacks a confirmed price.

## Follow-up: owner-requested dummy prices

The seventeen reference entries now use numeric demo BDT prices from `apps/web/src/lib/demo-prices.ts`, replacing pending-price presentation. Demo markers appear alongside these amounts and in the order draft. Cart/checkout arithmetic includes all selected entries. Existing original prices remain intact. Final selling prices are confirmed through WhatsApp before payment for demo-priced items.
