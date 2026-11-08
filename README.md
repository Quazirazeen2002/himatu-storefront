# HIMATU

Stage 2 interactive frontend for a premium anime figures and collectibles brand in Bangladesh.

## Run locally

Requires Node.js 20.9 or newer and npm. Node 22 LTS is recommended.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production preview:

```sh
npm run build
npm start
```

Validation: `npm run lint` and `npm run typecheck`. Run the build before standalone typechecking on a fresh checkout to generate Next route types. Webpack is selected explicitly for consistent local builds.

## Stack and structure

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Framer Motion and Lucide React. Pages and editorial components use Server Components; browser interactions use narrow client boundaries.

- `src/app`: homepage, route foundations, metadata, global styles and favicon.
- `src/components`: layout, primitives, product, collection, campaign and demonstration commerce components.
- `src/lib`: typed sample data, navigation, collections and CSS design tokens.
- `design-references`: all nine original user-supplied SVGs, preserved unchanged. Their historical branding and unrelated content are not rendered in the application.
- `docs`: design system, component conventions, routes, completion report.
- `output/playwright`: browser QA screenshots.

## Preview boundaries

Seven original HIMATU One Piece figure photographs are integrated locally. Prices and availability remain illustrative. Other franchise photography and actual 3D printing project photos are still pending. Bag, wishlist and recently viewed product IDs persist in localStorage with safe hydration and catalogue validation. No API, database, authentication, payment, order processing, quote submission or inventory service exists. Checkout, authentication, contact and printing inquiry forms validate locally and never transmit data. Printing references preview locally without upload. Shipping, returns, legal copy, contact details and social channels await business approval.

Start with [the Stage 2 completion report](docs/stage-2-completion-report.md), [frontend architecture](docs/frontend-architecture.md), [product discovery](docs/product-discovery.md), [commerce interactions](docs/commerce-interactions.md), [asset management](docs/asset-management.md) and [responsive QA](docs/responsive-testing.md). The [Stage 1 report](docs/stage-1-completion-report.md) is preserved as a historical record. Also see the [design system](docs/design-system.md), [component library](docs/component-library.md) and [route reference](docs/page-structure.md).

Stage 2 adds `/account/orders`; all earlier routes remain. No new runtime packages are required. Browser QA uses the Playwright CLI skill wrapper (see the responsive testing document).
