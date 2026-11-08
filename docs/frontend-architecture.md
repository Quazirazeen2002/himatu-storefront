# Stage 2 frontend architecture

The existing Next.js App Router, React, strict TypeScript, Tailwind 4, Framer Motion and Lucide stack is preserved. No new runtime dependency was added. Existing Stage 1 routes, design tokens, reference SVGs and reusable components remain in place.

## Rendering and boundaries

Pages and editorial content remain Server Components. AssetImage, ProductCatalog, ProductGallery, RecentlyViewed, ProductActions, form components and modal infrastructure are client components because they handle browser state, errors or input. Product and Collection interfaces remain the data contract for future adapters.

## Modules

- `src/lib/config.ts`: centralized navigation, collection and demonstration catalogue data. Stock states, product types, character names, descriptions and relative recency are fixture values, not business inventory.
- `src/lib/assets.ts`: image descriptors for campaigns, collections, product images/galleries and printing studies.
- `src/lib/discovery.ts`: shared tokenized search and filter/sort functions.
- `src/lib/demo-store.ts`: external demo state, sanitization, persistence and current-catalogue totals.
- `src/lib/validation.ts`: local field rules and focus-on-error helper.
- `StoreProvider`: narrow React context for shared shopping state, search text and header drawer state.

## Hydration and persistence

The external demo store uses `useSyncExternalStore` with a stable empty server snapshot. The client reads localStorage in its snapshot path; the initial server hydration uses the same server snapshot. Cached immutable snapshots avoid render loops. Mutations notify subscribers; storage events synchronize other tabs. Product IDs and quantities are stored, never catalogue prices or form data. Unknown and no-longer-purchasable IDs are discarded. Storage denial or malformed JSON produces a safe empty state and storage feedback in the order summary.

Recently viewed IDs are stored alongside bag/wishlist. No form entries, credentials, customer addresses or image data are persisted. Search text is in React memory only. Storage key: `himatu-demo-v2`.

## Accessibility and states

Native dialog powers gallery zoom and filters, while the existing header dialog powers bag/search/navigation. All provide labels, Escape dismissal, focus containment/return and background scroll locking. Inputs have visible labels, field errors and invalid-state semantics. Checkout focuses each new step heading. Reduced motion disables CSS animation; selected editorial reveals use Framer Motion’s reduced-motion hook.

Global loading and error boundaries provide consistent skeleton/retry views. These are framework states, not pretend API loading. Authentication/inquiry buttons briefly show local checking states and return explicit non-submission messages.

## Stage 3 boundary

No database, Supabase, migration, real auth, payment, order, file upload, inventory or admin infrastructure exists. Replace catalogue fixtures with a validated server data adapter; preserve interfaces and presentation boundaries. Validate all prices, quantities, availability and permissions again on the server before real commerce.
