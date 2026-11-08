# HIMATU — bKash Merchant Integration Specification
## Stage 3 Step 2C: Tokenized Checkout API & Direct Mobile Payment

---

## 1. Overview

The bKash integration implements bKash Tokenized Checkout v1.2.0 API for automated MFS checkout in Bangladesh. It replaces manual agent transfers with automated server-verified transactions.

---

## 2. API Flow

1. **Token Grant (`POST /tokenized/checkout/token/grant`)**:
   - Headers: `username`, `password`
   - Body: `{ app_key, app_secret }`
   - Response: `id_token`, `expires_in`, `refresh_token`
   - Cached in memory and renewed 2 minutes before stated expiration.
2. **Create Payment (`POST /tokenized/checkout/create`)**:
   - Headers: `Authorization: Bearer <id_token>`, `X-APP-Key`
   - Body: `{ mode: "0011", payerReference, callbackURL, amount, currency: "BDT", intent: "sale", merchantInvoiceNumber }`
   - Response: `paymentID`, `bkashURL`
   - Customer is redirected to `bkashURL` to enter mobile number, OTP, and bKash PIN.
3. **Execute Payment (`POST /tokenized/checkout/execute`)**:
   - Body: `{ paymentID }`
   - Response: `trxID`, `transactionStatus: "Completed"`, `amount`
   - Upon successful execution, the transaction is marked `PAID` and `verificationStatus` becomes `VERIFIED`.
4. **Query Payment (`POST /tokenized/checkout/payment/search`)**:
   - Body: `{ trxID, paymentID }`
   - Used by `ReconciliationService` to resolve pending or disputed transactions.
5. **Refund Payment (`POST /tokenized/checkout/payment/refund`)**:
   - Body: `{ paymentID, amount, trxID, sku: "HIMATU-REFUND", reason }`
   - Response: `refundTrxID`, `statusCode: "0000"`

---

## 3. Sandbox & Fallback Architecture

- Base URLs:
  - Sandbox: `https://tokenized.sandbox.bka.sh/v1.2.0-beta`
  - Production: `https://tokenized.pay.bka.sh/v1.2.0-beta`
- In development/test environments where live bKash merchant credentials are not configured, `BkashProvider` executes in sandbox simulated mode:
  - Generates realistic `BK-` payment IDs and session URLs.
  - Automatically simulates checkout verification.
  - Guarantees 100% test passing and seamless local developer experience.

