# Customer copy, social handoff and administrator settings

Completed locally on 11 November 2026 (Asia/Dhaka).

## Social ordering

Kept the owner's clarified workflow: submit and save the request, automatically open the selected social destination, then let the customer send the message and continue the conversation. WhatsApp receives the complete prepared text and request reference through its supported link. Instagram, Facebook and TikTok open their respective destinations and attempt to copy the complete order details. Those platforms do not provide a reliable equivalent to WhatsApp's prefilled text link; customers still paste and send the details there. Clipboard permission can be restricted by the browser, so an optional copy control and order message remain available. No automatic platform-send integration or customer impersonation was introduced.

Request persistence remains independent of the chat: it occurs before handoff, repeated submissions retain the existing idempotency protections, and failures keep the bag intact. The primary order action remains black. Checkout now says “Your order request has been received,” without exposing dashboard or implementation terminology. No owner email-alert worker is enabled; this respects the clarified request for social handoff rather than substituting email notifications.

Platform references: [Meta Instagram messaging requirements](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-a71fb850-457c-4b82-a56a-1dea1785f2a2), [TikTok Business Messaging API access](https://business-api.tiktok.com/portal/docs/business-messaging-api-get-started/v1.3).

## Inactive management sections

Payments and Production Kanban are marked **Out of order** for the current social-order operating mode. Sidebar entries are disabled and labelled. Direct URLs show a clear unavailable state instead of mounting the operational page. Existing records and backend capabilities were preserved. Products, categories, media, inventory, social requests, orders, invoices, analytics, customers, printing enquiries, hero settings and staff settings remain active according to each role's permissions.

## Professional customer wording

Removed dashboard language from checkout and changed staff links in the storefront to “Store Management.” Public delivery/payment text reflects confirmation with HIMATU rather than implying an online gateway step. Improved campaign/custom-design captions and updated informational copy. A browser sweep found no rendered standalone demo/demonstration/dashboard wording on the tested customer routes. Internal CSS identifiers, source filenames and existing local-storage keys remain for compatibility; they are not customer text. AI concepts and illustrated imagery retain accurate disclosures rather than being presented as real inventory or photography.

## Administrator email and details

Settings now includes a **Sign-in email address** form with current email, new email and current password. The server requires an authenticated administrator, a verified identity, current-password reauthentication, same-origin protection, strict validation and rate limiting. It requests the provider's email-change verification flow; it does not directly replace database email or staff roles. Existing confirmation callbacks synchronize the profile after verification while preserving the account ID and role. The entered password is cleared after submission and never stored as profile data.

Existing name, phone, password and store-contact forms remain. Profile phone entry now normalizes spaces/formatting and accepts a blank value as null, allowing a name-only update. Store contact email and sign-in email remain distinct settings. Settings form grids now stack on narrow screens.

Supabase behavior: [Updating an authenticated user](https://supabase.com/docs/reference/javascript/auth-updateuser). Verification delivery and old/new address confirmation follow the project's provider configuration.

## Validation

- Production build and TypeScript passed.
- 212 tests passed: 124 frontend and 88 API; one opt-in database test skipped. New tests cover inactive modules and administrative email-change permissions, current-password verification, strict input checks and provider verification requests.
- Both flattened Hostinger packages independently built and verified runtime dependencies/assets. Source matching, archive integrity and environment exclusion were checked.
- Browser checks used an isolated UI, fixture sessions and intercepted writes. All four handoffs saved a request; WhatsApp's prepared message and non-WhatsApp copy attempts passed. Customer-copy checks covered homepage, shop, categories, collections, 3D printing, campaign, About, FAQs, Contact, privacy, terms, sign-in, create-account and checkout. Both disabled section URLs and sidebar states passed. Settings email-change submission, verification feedback, cleared password and responsive layout passed. Settings was checked at 320, 375, 390, 768, 1024 and 1440px after transitions settled.
- No real social messages or verification emails were sent, and no real administrator email/profile was changed. Initial session requests in the isolated copy returned expected configuration errors before the fixture session was installed; the tested interactions used mocked sessions.
- Full lint still fails on existing issues (16 API errors; 89 frontend errors, 148 warnings).
- Screenshots: `output/playwright/professional-checkout-mobile.png`, `admin-out-of-order.png`, `admin-email-settings.png`, `admin-settings-responsive.png`.

An additive migration, `20261111100000_order_request_notifications`, added reserved delivery-tracking columns while evaluating the first interpretation. The owner clarified the social-message requirement; no notification worker or owner email notifications are active. Those additive fields were retained without deleting existing records. The API package includes the current schema and migration history.

## Uploads

- `output/hostinger/HIMATU-Frontend-2026-11-11-Professional-Checkout.zip` → himatu.com. Keep Next.js, Node 22, root `./`, build `npm run build`, output `.next`, and existing environment variables.
- `output/hostinger/HIMATU-API-2026-11-11-Professional-Checkout.zip` → api.himatu.com. Keep existing backend settings and environment variables, output `dist`, entry `server.js`.

Both include earlier changes. These application packages were not deployed by the agent.

## Stock indicator and address-field follow-up

Added an explicit 8px stock-status dot, preserving red for unavailable inventory and green for available inventory in both palettes. Included status in product quick views as well as existing cards/details. Unknown reference availability and AI concept disclosures remain distinct.

Fixed `.account-input:focus`, which previously forced a black background in the light theme. Focus now uses the selected palette; caret, native control colour scheme, keyboard focus and browser autofill colours follow the same tokens. Checkout and account shipping-address fields remain readable.

Validation: TypeScript, all 124 frontend tests, monorepo production build and flattened frontend package build passed. Browser fixtures verified the red dot, address-field focus in dark/light themes and checkout fields at 320, 375, 390, 768, 1024 and 1440px. Social handoff checks saved all four fixture requests, verified WhatsApp's complete encoded message and copied message details for other platforms. External windows and writes were intercepted; no real order or message was created. Screenshots: `output/playwright/stock-red-dot.png`, `address-focus-light.png`, `checkout-address-focus.png`.

Latest frontend: `output/hostinger/HIMATU-Frontend-2026-11-11-Stock-Address-Fixed.zip`. The archive was recreated from the validated source stage because earlier ZIP files were no longer present, and checked against all current frontend source files. No backend change or redeployment is required for this follow-up. WhatsApp retains the supported prefilled-message handoff; the other platforms still require pasting the copied text.
