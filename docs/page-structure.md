# Page foundations

All routes share the announcement, navigation, modal infrastructure and footer.

- `/`: premium campaign hero, photographic universe discovery, featured original figures, a neutral collection story, custom printing and brand statement.
- `/shop`: Shop All with URL-backed search, filters, sorting and nine-entry pagination; `?new=1` restricts to verified new arrivals and `?sort=new` sorts by fixture recency.
- `/collections`: collection gallery.
- `/collections/[slug]`: One Piece, Naruto, Dragon Ball, Jujutsu Kaisen, Demon Slayer and Other Collections.
- `/products/[slug]`: seven original-photo figure detail pages plus three labelled AI concept pages; accordion details and wishlist actions. Only priced figure fixtures expose demo bag actions.
- `/bag`: demo line items, quantity/removal, sample order summary.
- `/checkout`: five-step local customer/address/delivery/payment/review flow; no payment processing or order submission.
- `/sign-in`: photo-led sign-in with remember-me preference preview, password visibility, recovery navigation and explicit unconnected service response.
- `/create-account`: photo-led registration with full name, email, password, matching confirmation and local validation without account creation.
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

## Stage 2.5 account flow

- `/forgot-password`: email-validated password-recovery preview; no recovery email is sent. Links back to sign-in.
- The visible landing hero SIGN IN button and mobile Sign in link resolve to `/sign-in` while signed out. The top-right account icon is removed. `/account` and `/account/orders` remain intact as foundations.
- Sign-in links to registration and recovery. Registration and recovery link back to sign-in. Privacy and terms remain reachable from all customer forms.
- All existing content routes remain, with 36 content destinations after adding recovery. The seven original-photo products and three non-sale concept routes are unchanged.

Authentication uses a typed frontend adapter, with no Supabase configuration, production session, credential persistence or backend request. A future session provider will use the shared account destination helper to select `/account` only for a real signed-in session.

## Stage 3 customer authentication

The Next.js app now resides in apps/web. Existing routes remain. `/account` loads the protected customer profile through the server session endpoint, and `/update-password` provides the recovery password form. Same-origin `/api/auth/[action]` handlers and `/auth/callback` connect Supabase Auth to the existing interfaces. Landing/mobile session links show MY ACCOUNT only after a verified profile response; the top-right account icon remains removed. Email delivery setup is pending at the owner’s request. Commerce/order routes remain demonstrations.
