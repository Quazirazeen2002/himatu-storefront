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
