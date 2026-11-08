# Page foundations

All routes share the announcement, navigation, modal infrastructure and footer.

- `/`: refined hero, featured original figures, collection discovery, custom printing and brand statement.
- `/shop`: Shop All with URL-backed search, filters, sorting and nine-entry pagination; `?new=1` restricts to verified new arrivals and `?sort=new` sorts by fixture recency.
- `/collections`: collection gallery.
- `/collections/[slug]`: One Piece, Naruto, Dragon Ball, Jujutsu Kaisen, Demon Slayer and Other Collections.
- `/products/[slug]`: seven original-photo figure detail pages plus three labelled AI concept pages; accordion details and wishlist actions. Only priced figure fixtures expose demo bag actions.
- `/bag`: demo line items, quantity/removal, sample order summary.
- `/checkout`: five-step local customer/address/delivery/payment/review flow; no payment processing or order submission.
- `/sign-in`: split editorial authentication foundation, local validation without real sign in.
- `/create-account`: registration foundation, local validation without account creation.
- `/campaign`: editorial collection landing.
- `/3d-printing`: service campaign, concept showcase, process, options, local inquiry/image preview and FAQ.
- `/about`: supplied brand identity and business focus.
- `/wishlist`: browser-persistent favourites; empty-state guidance.
- `/account`: account and saved-item entry points without a fake signed-in user.
- `/order-confirmation`: explicit confirmation layout preview, no actual order claim.
- `/contact`, `/faqs`, `/privacy`, `/terms`, `/shipping-returns`: safe informational foundations pending approved business details.
- Unknown collection/product slugs and unknown pages resolve to the custom 404.

Dynamic route parameters and query parameters use the asynchronous Next.js App Router APIs. Collection, product and information params are statically generated; the query-aware catalogue reads URL state inside a client Suspense boundary. Internal navigation uses Next Link. Footer links never point to invented external accounts.

- `/account/orders`: explicit empty order-history preview without fabricated orders.

Stage 2 enriches all existing routes. Approved product and collection slugs are unchanged.
