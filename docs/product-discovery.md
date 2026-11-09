# Product discovery

Updated 8 November 2026.

## Catalogue and accuracy

`src/lib/config.ts` retains seven original HIMATU figure records, their photographs and existing demonstration prices/states. `src/lib/catalogue.ts` adds three distinct original AI-generated concepts, yielding ten catalogue entries. The discriminated Product union separates priced FigureProduct records from ConceptProduct records with no price or availability. Concepts cannot reach ProductActions, bag totals or checkout. Storage sanitization rejects concept IDs in the bag while allowing them in wishlist/recently viewed.

Every concept displays **AI-GENERATED CONCEPT — NOT FOR SALE**. Existing values are labelled sample prices and demonstration stock, not verified business data. No verified new arrivals currently exist; `/shop?new=1` intentionally displays an honest empty state. `sort=new` means fixture recency, not a verified release date.

## Search, filters and sort

Header and catalogue search use `matchesSearch`: case-insensitive, whitespace-trimmed, all words matched across name, character, franchise and description. Both include the three clearly labelled concepts.

Filters combine with AND: franchise, inclusive sample BDT price range, demonstration availability and product type. Concepts participate in search/type/franchise filters; price and availability filters exclude entries without those values. Price sorting always places unpriced concepts last. Featured preserves configured order; newest uses relative fixture recency; A–Z sorts by name. Invalid min/max ranges display feedback. Collection routes lock the universe even when clearing filters. Wishlist uses the same engine on saved IDs.

## URL state and pagination

The client catalogue reads `useSearchParams` inside a Suspense boundary. Native history pushState/replaceState integrates with the Next.js App Router and preserves back/forward behavior without fetching a backend.

Supported parameters: `q`, `universe`, `min`, `max`, `availability`, `type`, `sort`, `new=1`, and `page`. Defaults are omitted when cleared. For example, `/shop?sort=low&page=2` is shareable and survives refresh. Search typing replaces history to avoid an entry per keystroke; filter, sort and page changes push history entries.

`discover()` filters and sorts before `paginate()`. PAGE_SIZE is nine, independent of actual catalogue length. With the current ten entries, page one shows 1–9 and page two 10–10. Counts and page numbers recalculate from filtered results; no sample total is hardcoded. Changing any filter or sort removes page, returning to page one. Changing pages retains all selected filters. Invalid/stale pages clamp to the available range and are canonicalized in the URL. Previous and Next disable at their respective boundaries. Empty results show 0–0 of 0 and no pagination controls.

Desktop uses a three-column grid and sidebar. Mobile/tablet use the existing focus-managed filter dialog with live result count. Controls have touch-sized targets, an active page indicator and accessible names.

## Exploration and buyer journey

The header gives direct access to Shop All, Collections, verified New Arrivals and 3D Printing. Product cards lead directly to details; actual figure detail actions retain quantity, persistent demo bag feedback and demo checkout. Concepts retain a wishlist action only. Original-photo galleries keep zoom and accessible image labels. Each current record has one genuine source image or one concept image; additional product views are not fabricated. Recently viewed IDs remain browser-persistent.

## Collectible refinement — 9 November 2026

The catalogue now contains eight existing local figure entries and seven unpriced original AI concepts. Nine-item pagination remains dynamic: the current fifteen entries span nine and six items. Concepts are explicitly not for sale, remain wishlist-compatible and never enter the shopping bag. Four new studies are highlighted in the homepage concept lab.

The owner approved a 15% introductory discount on existing prices. Original prices are unchanged; separate sale prices drive filtering, sorting, product presentation, bag totals and checkout line totals. Admin-managed API prices override local fallbacks by matching slug or exact product name. Clear the admin Sale Price field to remove an offer. No inflated comparison prices were introduced. The existing difference between backend and local catalogue membership remains documented in `design-system.md`.

## Product categories and franchises — 9 November 2026

Product category and franchise are independent dimensions. `/shop?category=action-figures&universe=naruto` combines both; pagination resets when either changes and retains both when moving between pages. Existing `universe` collection URLs remain supported.

The five starting product categories are Action Figures, Keychains, Katanas, T-shirts and Accessories. Anime includes One Piece, Naruto, Dragon Ball, Attack on Titan, Demon Slayer, Bleach, Hunter × Hunter, Solo Leveling, Jujutsu Kaisen, Blue Lock and Death Note. Marvel, DC and Movies have separate family tabs; Other Collections retains original concept studies. `/categories` presents product categories and family entry points. `/collections` defaults to Anime. New active admin entries appear through the live category registry and dynamic detail routes without a rebuild.

Product editing retains the existing franchise assignment and adds a separate product-category assignment. The database migration preserves existing category IDs. The setup script assigned only missing product types and verified unchanged original prices, sale prices, inventory quantities and franchise assignments. It saved a pre-change backup under ignored `output/category-backups/` before applying the initial templates.

The storefront still uses its existing local commerce catalogue with API metadata/price overrides for matching names or slugs. Creating a category provides a browseable category and cover, but does not create products or automatically synchronize newly created backend products into that local catalogue. Empty sectors provide honest empty states. Demo artwork is never purchasable inventory.

Administrators: open **Admin → Categories → Add category or franchise**. Choose the kind, name, slug, description, ordering and visibility; franchises also have a family. Supply an HTTPS/local cover URL or upload JPEG, PNG or WebP (maximum 10 MB), and identify illustrative artwork with the Demo Artwork option. Missing covers use a neutral fallback. Hidden entries remain available in the admin list for restoration. Category kind cannot change while products are assigned. Upload and mutation endpoints require an administrator.

## Real-photo catalogue and enquiries — 9 November 2026

The active shop contains eight existing priced products and seventeen real-photo reference entries (25 total; pages of 9, 9 and 7). Each requested named franchise and product category has at least one entry. References have no invented price or availability and are excluded by price/stock filters when those require confirmed values. They support search, category/franchise filtering, pagination, wishlist, detail galleries and source-linked WhatsApp enquiries. The seven AI concepts retain their direct detail routes but are no longer in the shop catalogue or homepage concept lab.

Quick view provides the same purchase or enquiry actions with fewer navigation steps. Mobile shortcuts expose categories, wishlist and the saved bag. Checkout defaults to a fully formatted WhatsApp order request for the existing priced bag; website checkout remains selectable. See `original-photography-and-whatsapp.md` for the exact message contents and confirmation boundary.

## Cart and direct enquiry together — 9 November 2026

Reference product details and quick view now offer a quantity selector and **Add to cart** before **Ask HIMATU on WhatsApp**. Both paths remain available. Reference items persist in the same saved bag, support quantity changes/removal, and contribute to header and checkout item counts. They retain unknown prices rather than being treated as free.

A cart containing references can be submitted as one WhatsApp order/quote request together with priced products. Known prices and quantities are included, unpriced lines say “Please quote,” and the complete total remains awaiting confirmation. Website payment checkout is disabled for that mixed/unpriced cart until pricing is confirmed. Fully priced carts retain both checkout channels. This supersedes the earlier restriction that reference entries could not be added to the bag.

## Numeric demo prices — 9 November 2026

At the owner's request, all seventeen sourced reference entries now have positive illustrative BDT prices instead of pending-price text. Amounts are centralized in `apps/web/src/lib/demo-prices.ts` (৳199–৳7,490) and displayed with a Demo price marker. Existing owner-configured product prices and discounts remain unchanged.

Demo amounts participate in price filtering/sorting, item line totals, cart totals, checkout totals and WhatsApp messages. The WhatsApp draft marks affected lines DEMO PRICE and uses a numeric estimated total. Add to cart and direct WhatsApp enquiry remain available. Demo-priced items continue through WhatsApp confirmation before payment; these amounts are not confirmed inventory prices or new backend price records. This supersedes the earlier pending-quote presentation.
