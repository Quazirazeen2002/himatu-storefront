# HIMATU — Commercial Quotation Engine Specification
## Stage 3 Step 2C: Itemized BDT Cost Calculation & Custom Order Generation

---

## 1. Quotation Engine Architecture

When a store owner or artisan reviews an inquiry in `/admin/3d-printing`, they can open the Quotation Builder to generate an itemized price quotation (`QUO-YYYY-XXXX`).

---

## 2. Cost Breakdown Model

The quotation engine calculates the total price from 7 discrete manufacturing components:

$$\text{Subtotal} = C_{\text{sculpt}} + C_{\text{resin}} + C_{\text{print}} + C_{\text{post-cure}} + C_{\text{paint}} + C_{\text{custom}} + C_{\text{shipping}}$$

$$\text{Total Amount} = \max(0, \text{Subtotal} - D_{\text{discount}})$$

$$\text{Deposit Amount} = \text{round}\left(\text{Total Amount} \times \frac{P_{\text{deposit}}}{100}\right)$$

Where:
- $C_{\text{sculpt}}$: 3D CAD modeling and digital geometry sculpting.
- $C_{\text{resin}}$: 8K photopolymer resin consumption in grams.
- $C_{\text{print}}$: SLA machine slicing and laser exposure hours.
- $C_{\text{post-cure}}$: Ultrasonic IPA wash, support scar removal, and UV curing.
- $C_{\text{paint}}$: Master hand-painting, airbrush gradient shading, and anime eye decals.
- $C_{\text{custom}}$: Custom diorama base, LED wire channels, or translucent FX.
- $C_{\text{shipping}}$: Corner-protected insured courier packaging.
- $D_{\text{discount}}$: Promotional or collector club discount.
- $P_{\text{deposit}}$: Commitment deposit percentage (default 50%).

---

## 3. Customer Acceptance & Order Creation

1. Customer reviews the itemized breakdown at `/account/printing-requests/:id`.
2. Upon clicking "Accept & Pay Deposit", the backend executes an atomic transaction:
   - Quotation status becomes `ACCEPTED`.
   - `Order` record is instantiated for the deposit amount with SKU `3D-PR-...` and agreed customization specs.
   - Request status transitions to `IN_PRODUCTION`.
   - `PrintingProduction` record is created, initializing the 10-stage fabrication pipeline.
   - Customer is routed immediately into `PaymentsModule` to complete payment via bKash, SSLCOMMERZ, or COD.

