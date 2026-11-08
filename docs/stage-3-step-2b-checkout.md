# HIMATU — Stage 3 Step 2B: Checkout Engine & Bangladesh Delivery Calculations

## 1. Overview
The checkout engine powers the unified, responsive checkout experience at `/checkout`. It enforces customer authentication, verified address selection, courier shipping charge calculation across Bangladesh, and Cash on Delivery (COD) order placement.

---

## 2. Configurable Bangladesh Shipping Model

Shipping charges are computed strictly on the backend via `ShippingService`:
- **Inside Dhaka**: ৳80 BDT (insured hand-to-hand courier, 1–2 business days).
- **Outside Dhaka (All 63 Other Districts)**: ৳130 BDT (priority nationwide cargo, 2–4 business days).
- **Collector Vault Pickup (Dhanmondi, Dhaka)**: ৳0 BDT (ready within 24 hours).
- **Free Shipping Incentive**: Orders with a subtotal of ৳15,000 BDT or higher automatically receive **FREE SHIPPING** nationwide.

---

## 3. Address Management & Isolation

1. **Multiple Addresses**: Customers can maintain multiple saved delivery destinations labeled as `HOME` or `OFFICE`.
2. **Default Address Invariant**: When an address is created or marked as default, a transactional database operation unsets `isDefault: false` across all other addresses for that user.
3. **Strict Ownership Enforcement**: Endpoints verify `address.userId === req.customer.id`. Customers can never view, select, edit, or delete another customer's address.

---

## 4. End-to-End Checkout Workflow

1. Customer arrives at `/checkout`. If unauthenticated, `proxy.ts` redirects to `/sign-in?next=/checkout`.
2. Existing saved addresses are retrieved via `GET /api/v1/addresses` and pre-populated into the district selector.
3. Customer selects or enters contact information and delivery address.
4. Client sends order creation payload: `{ addressId, paymentMethod: 'COD', customerNotes }`.
5. Backend verifies cart, deducts stock atomically, computes final totals, and generates order reference `HMT-YYYYMMDD-XXXXX`.
6. Client cart is cleared and user is redirected to `/order-confirmation?orderNumber=<orderNumber>`.

