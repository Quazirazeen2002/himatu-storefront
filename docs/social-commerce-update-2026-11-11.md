# Social ordering, staff permissions and reviewed invoices

Implemented 11 November 2026 (Asia/Dhaka).

## Checkout and social order capture

Removed shipping-method and payment-method selectors and the website payment action from the current checkout. The order button is black with white text. WhatsApp, Instagram, Facebook and TikTok are available under “How would you like to order?”. The summary shows an items estimate; delivery is arranged in chat. No hidden shipping charge is added or free delivery promised.

An authenticated customer’s request is saved through `POST /api/v1/social-orders` before an external chat is opened. It includes selected items, quantities, displayed estimates and delivery/contact details. A request reference is included in the chat message. Repeated pending submissions reuse a per-customer idempotency key; browser storage holds a fingerprint/reference, not contact details. After staff close the prior request, another purchase can obtain a new reference. If registration fails, the chat is not opened, an error remains visible and the bag is preserved.

WhatsApp opens a prefilled draft. Instagram and Facebook open their chat destinations; TikTok opens the supplied account. For these channels the complete message is copied, with a visible manual-copy fallback. Customers still paste/send it themselves and may need to sign into the platform. This does not monitor outside conversations, infer that a message was delivered, or import orders made directly in external chats. Those orders can be enrolled manually.

## Dashboard workflow

New navigation:

- **Social Order Inbox** (`/admin/social-orders`): pending requests, review, dismissal, confirmed order links, and manual enrollment of chat orders.
- **Homepage Slides** (`/admin/content`): choose 1–8 existing uploaded product photographs, edit accessible descriptions, reorder, remove and save. Upload additional photographs through Products → Photos. Original four images remain as the fallback until a configuration is saved.
- **Staff Roles** (`/admin/staff`): search registered accounts by email and assign Customer, Moderator or Admin. Self-role changes are blocked; role updates recheck the acting administrator and protect the last administrator in a serializable transaction.

After a chat is confirmed, staff review customer details, line prices, quantities, delivery charge and discounts, then enroll the request. Catalogue items can be selected for correct stock and product analytics; custom/reference lines can also be recorded. Manual enrollment requires an existing registered customer email and never creates a fabricated customer account. Confirmation is transactional: a request can be enrolled only once, totals are computed on the server, catalogue stock is checked and deducted atomically, and failure rolls back the whole operation. The resulting order appears in the existing Orders workspace and analytics. Requests alone do not count as orders or revenue. Confirmed unpaid orders remain pending revenue; recorded payment/delivery follows existing analytics rules. Only admins can initially flag received payment in this enrollment flow.

## Staff permissions

Admins retain full management access, including staff, settings, homepage configuration, payments, analytics and invoice email. Moderators can manage products, categories, inventory, order requests and existing order fulfilment. Moderator navigation excludes admin-only areas; backend guards enforce the same boundary independently. Roles come from database profiles; customer-editable metadata no longer supplies elevated fallback privileges. All registrations still create Customer profiles.

## Invoice review and email

Both enrolled social orders and existing website orders have a **Prepare invoice for review** action. The invoice contains HIMATU branding, order reference, issue date, customer/delivery details, item quantities and prices, delivery, discount, total, payment status and support contact. Customer-entered content is escaped. The HTML is rendered in a sandboxed preview and is suitable for email.

Only an admin can review and explicitly approve/email an invoice. Delivery uses the API’s SMTP environment and the registered customer’s email, displayed in the preview. Review stores an invoice snapshot and reviewer identity. Sending rejects cancelled or subsequently changed orders. A database claim prevents concurrent sends; sent invoices are not silently reset when reviewed again. An uncertain transport failure locks retries; an administrator must check the sender delivery log and explicitly unlock a retry. SMTP acceptance is recorded separately from proof that a customer read or received the email. No customer email was sent by the agent.

API SMTP keys: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_SENDER_EMAIL` (or `SMTP_FROM`). Port 587 requires STARTTLS; port 465 uses TLS. Credentials stay server-only. Removed an embedded password fallback from the optional SMTP configuration script.

## Database and deployment

Applied additive migration `20261111090000_social_orders_roles_invoices` to the configured database after verifying it was the only pending migration. It adds the Moderator enum value, SocialOrderRequest, OrderInvoice and SiteContent tables, with indexes and relationships. Existing product/order data was preserved. Nodemailer is included in the API production dependencies. Hero configuration is persisted in PostgreSQL rather than ephemeral hosting files.

Deploy both archives while retaining environment variables:

- `output/hostinger/HIMATU-Frontend-2026-11-11-Social-Orders.zip` → **himatu.com**. Next.js, Node 22, root `./`, build `npm run build`, output `.next`.
- `output/hostinger/HIMATU-API-2026-11-11-Social-Orders.zip` → **api.himatu.com**. Existing NestJS settings, Node 22, root `./`, build `npm run build`, output `dist`, entry `server.js`. Ensure invoice SMTP variables are also configured on Hostinger’s API app.

The API archive includes the current schema/migrations, generated-client build setup and SMTP dependency lockfile. ZIPs exclude environment files, installed dependencies and build output. These application packages have not been deployed by the agent.

## Validation and limits

- TypeScript and production build passed; both flattened Hostinger packages independently built and verified their runtime assets/dependencies.
- 206 tests passed: 118 frontend and 88 API; one opt-in database test skipped. Coverage includes repeated pending submissions, subsequent purchases, request/role boundaries, enrollment totals, duplicate enrollment, invoice escaping, review requirement, stale-order rejection, concurrent email claims and retry-unlock confirmation.
- Real database workflow check: request idempotency → enrollment → invoice generation succeeded inside a transaction; every test write was deliberately rolled back and absence of the test order was verified afterward.
- Local API health returned database up. Anonymous staff access returned 401. SMTP connection/authentication verified successfully without sending email.
- Browser checks used an isolated UI with intercepted writes and a fixture staff/customer session. All four checkout channels registered before handoff; staff reviewed/enrolled a request; invoice preview and an intercepted approval/email action passed. Hero settings changed the public slideshow. Moderator navigation and denied staff-page access passed. Checkout and inbox were checked at 320, 375, 390, 768, 1024 and 1440px after responsive transitions settled. Final screens recorded no uncaught application errors; development font warnings remained.
- Screenshots: `output/playwright/social-workflow-checkout.png`, `social-workflow-invoice.png`, `social-workflow-hero-admin.png`, `social-workflow-moderator.png`.
- Repository-wide lint still has pre-existing failures; targeted new workflow files have zero lint errors and three warnings (effect dependencies and an admin thumbnail optimization suggestion).

Live platform message delivery, customer email delivery and Hostinger production configuration require post-deployment verification. External chat APIs/webhooks are not configured, so conversations outside website checkout are entered through manual enrollment.

Final visual check: the actual invoice renderer (fictional QA customer and item data) was reviewed at 390px and 1024px with no horizontal overflow. Evidence: `output/playwright/invoice-renderer-390.png` and `invoice-renderer-1024.png`. The final standalone frontend package build verified its local Next.js runtime, public assets and chunks. Final full lint totals remain 16 API errors and 89 frontend errors / 148 warnings; new workflow targets have zero errors and three warnings.
