# Demonstration commerce interactions

## Bag and wishlist

All interactions are local demonstrations. Bag and wishlist persist via `himatu-demo-v2`. Quantity updates clamp to whole numbers from 0–10; zero removes a line. The selector uses 1–10 with separate removal. Add-to-bag and Buy Now reject the sold-out fixture. Pre-order is an explicit demo state; it does not create a reservation. Buy Now adds the selected quantity and opens checkout.

On restore, the store discards unknown product IDs, unsupported sold-out lines, invalid quantities and duplicates. Oversized quantities are clamped. Only IDs/quantities are saved; totals always use the current catalogue price, handling future catalogue changes without trusting stored monetary values. `getTotals` supplies the same item subtotal and count to summary, checkout and confirmation. Delivery fees are not calculated or invented. The item subtotal is never presented as a complete payable amount.

Wishlist toggles expose pressed state, persist saved IDs and support removal and navigation. Empty states guide people back to collection discovery. Storage failures degrade to in-memory interactions with a visible message in the summary.

## Checkout

Five local steps: customer, address, delivery, payment, review. Customer fields: full name, Bangladesh mobile and email. Address fields: district, area, full address; country is Bangladesh. Required fields, email format, mobile format and field lengths are validated locally; invalid fields receive errors/focus. Back navigation retains values in component memory.

Delivery offers an explicitly hypothetical standard method without a fee or timeline. Payment choices are Cash on Delivery, bKash and Card payment, each labelled as a demonstration; no payment credentials are requested. Review shows selected items, current sample prices, unconfirmed delivery and method selection. View Demo Confirmation navigates to a clear non-order confirmation. A separate real-submission control is disabled. Demo confirmation retains the bag and has no invented order number.

No personal data is placed into storage, a URL, API request or order record. The `demo=reviewed` query flag contains no customer data.

## Account and information

Sign-in and registration validate example input locally, include password visibility, field errors, pending disabled states and a result explicitly saying no authentication occurred. Password minimum length is a local form-demo rule, not an approved account security policy. Order history shows no fabricated customer data. Contact validates locally and never sends a message.

## 3D printing inquiry

Required customer name, email, Bangladesh mobile, character, franchise, preferred dimensions and quantity. Additional requirements and reference image are optional. Quantity accepts whole values 1–100 as a demonstration input limit, not a production capacity claim. Supported reference types: JPEG, PNG, WebP with matching extension; non-empty, up to 5 MB. Browser decoding detects unusable images. Object URLs provide local previews and are revoked on replacement/unmount. Files are never uploaded. Valid submission returns a clear local-only message without a quotation or business receipt claim.

## Stage 3 requirements

Server-authoritative catalogue and stock, authenticated customer state, cart synchronization, real delivery quoting/coverage, payment intent and callback verification, transactional order processing, idempotency, approved confirmation emails, protected media uploads, inquiry processing, rate limits and server-side validation are all still required.
