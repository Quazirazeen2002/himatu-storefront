# HIMATU — Refund & Discrepancy Operations Specification
## Stage 3 Step 2C: Financial Reconciliation & Refund Management

---

## 1. Refund Policy & Rules

1. **Eligibility**: Only transactions in `PAID` status can be refunded. Transactions in `PENDING` or `FAILED` cannot be refunded.
2. **Amount Limits**:
   - Partial refunds are permitted.
   - The sum of previous completed refunds plus the new refund request cannot exceed the original paid transaction amount.
   - Any attempt to refund more than the remaining refundable balance is rejected with an HTTP 400 Bad Request error.
3. **Audit Trail**:
   - Every refund creates a unique `Refund` record (`REF-YYYYMMDD-XXXX`).
   - Every refund writes an immutable `PaymentEvent` log with event type `REFUND_ISSUED`.
   - The identity of the administrator initiating the refund is recorded (`initiatedBy`).
4. **Order Status Synchronization**:
   - If a refund represents the full value of the order, the `Order` status transitions to `CANCELLED` and `paymentStatus` becomes `REFUNDED`.

---

## 2. On-Demand Reconciliation

Store owners can click the "Reconcile" button on any transaction in `/admin/payments`.
The system performs:
1. Provider query (`queryPayment`) against live gateway APIs.
2. Discrepancy detection between local database state and external banking records.
3. Automatic resolution: If the bank confirms the payment was captured, the transaction transitions to `PAID`, the order is confirmed, and a `RECONCILIATION_MATCH` event is recorded.

