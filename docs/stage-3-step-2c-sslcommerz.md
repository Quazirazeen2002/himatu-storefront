# HIMATU — SSLCOMMERZ Integration Specification
## Stage 3 Step 2C: Multi-Card & Internet Banking Gateway

---

## 1. Overview

SSLCOMMERZ provides comprehensive payment coverage across Bangladesh, supporting:
- Visa, Mastercard, American Express (credit/debit cards).
- Bangladeshi internet banking (City Touch, EBL Skybanking, Islami Bank, DBBL Nexus).
- Multi-channel MFS fallback.

---

## 2. API Lifecycle

1. **Hosted Session Initiation (`POST /gwprocess/v4/api.php`)**:
   - Parameters:
     - `store_id`, `store_passwd`
     - `total_amount`, `currency: "BDT"`
     - `tran_id` (Unique transaction reference `TXN-...`)
     - `success_url`: `{API_BASE_URL}/payments/sslcommerz/success`
     - `fail_url`: `{API_BASE_URL}/payments/sslcommerz/fail`
     - `cancel_url`: `{API_BASE_URL}/payments/sslcommerz/cancel`
     - `ipn_url`: `{API_BASE_URL}/payments/sslcommerz/ipn`
     - Customer details (`cus_name`, `cus_email`, `cus_phone`, `cus_add1`, `cus_city`)
     - Shipping profile & product parameters
   - Response:
     - `status: "SUCCESS"`
     - `GatewayPageURL`: Hosted SSLCOMMERZ payment portal URL.
     - `sessionkey`: Session identifier.
2. **Server-to-Server Validation (`GET /validator/api/validationserverAPI.php`)**:
   - Parameters: `val_id`, `store_id`, `store_passwd`, `v=1`, `format=json`
   - Verification checks:
     - `status === "VALID"` or `status === "VALIDATED"`
     - `currency_amount` matches order amount.
     - `currency_type === "BDT"`
3. **Transaction Query API (`GET /validator/api/merchantTransIDvalidationAPI.php`)**:
   - Parameters: `tran_id`, `store_id`, `store_passwd`, `format=json`
   - Used by `ReconciliationService` to verify settlement status directly from the gateway bank logs.
4. **Refund API**:
   - Parameters: `bank_tran_id`, `store_id`, `store_passwd`, `refund_amount`, `refund_remarks`
   - Response: `refund_ref_id`, `status: "success"`

---

## 3. Environments

- Sandbox: `https://sandbox.sslcommerz.com`
- Production: `https://securepay.sslcommerz.com`
- Toggled via `SSLCOMMERZ_IS_LIVE=true` in environment configuration.

