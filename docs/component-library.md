# Component library

Components use typed props and composition. Server rendering is the default; `use client` is reserved for state, dialogs, forms, filters and motion. Common primitives are grouped in a small shared module rather than one file per trivial element.

## Layout

- `Header`: announcement bar, desktop navigation/dropdown, accessible mobile navigation, search modal and bag drawer.
- `Footer`: real internal support and policy routes; social channels remain descriptive placeholders until supplied.
- `StoreProvider`: persistent demo bag/wishlist/recent views, search and active drawer; no backend emulation.

## UI primitives

`Button`, `ButtonLink`, `IconButton`, `Container`, `Badge`, `SectionHeading`, `Input`, `Select`, `DemoNotice`, `Divider` live in `ui/Primitives.tsx`. Use buttons for actions and links for navigation. Inputs require an explicit ID and visible label. Icon buttons require accessible labels. `Reveal` limits motion to selected sections and respects reduced motion.

## Product and collection

- `FigureArt`: original vector placeholder, unique gradient IDs and descriptive accessible name.
- `ProductCard`, `ProductGrid`: shared ratio, sample badges, BDT price, franchise, unconfirmed availability and wishlist control; optional mobile rail.
- `ProductCatalog`: shared universe filter, price/new sorting, empty results and wishlist mode.
- `CollectionGrid`: full gallery and compact homepage rail, using centralized collection configuration.

## Campaigns

`HeroCampaign`, `CampaignBanner`, `PrintingCampaign`, `BrandMessage` provide reusable campaign vocabulary. Page headings remain h1; campaign section headings are h2.

## Demonstration commerce

`WishlistButton`, `AddToBag`, `QuantitySelector`, `BagItems`, `OrderSummary` share browser state. Quantities are limited to 1–10 in the selector; removal is explicit. `AuthForm` includes password visibility, local validation and pending disabled state. `CheckoutForm` demonstrates locally validated checkout steps with disabled real order submission. No entry is sent anywhere. See the Stage 2 architecture and commerce documents for the newer locally validated forms. Confirmation remains an explicit layout preview without an invented order number.

## Data contract

`src/lib/types.ts` defines Product and Collection. `src/lib/config.ts` centralizes navigation, collections, demonstration products, BDT formatting and informational page content. A future data adapter can supply approved catalog objects while keeping the UI isolated from infrastructure. Do not connect server credentials to client components.

## Stage 2 additions

`AssetImage`, `ProductGallery`, `RecentlyViewed`, `ProductActions`, `Modal`, `CheckoutForm`, `DemoConfirmation`, `PrintingInquiry` and `ContactForm` extend the original component library. `ProductCatalog` adds shared search, compound filters, filter chips, price range and mobile filter dialog. `AuthForm` now validates locally rather than disabling its preview action. Global loading/error boundaries provide skeleton and retry views. See `frontend-architecture.md` for current state boundaries.
