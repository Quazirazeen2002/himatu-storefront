# HIMATU — Stage 3 Step 2B: Orders, Snapshots, Inventory & Cancellation

## 1. Overview
The HIMATU order management system orchestrates transactional order creation, historical invoice snapshots, inventory decrements, and controlled cancellation workflows.

---

## 2. Order Database Schema & Invariants

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum PaymentMethod {
  COD
  BKASH
  NAGAD
  CARD
}

model Order {
  id              String        @id @default(uuid()) @db.Uuid
  orderNumber     String        @unique @db.VarChar(50)
  userId          String        @db.Uuid
  user            UserProfile   @relation(fields: [userId], references: [id], onDelete: Restrict)
  addressSnapshot Json
  subtotal        Int
  shippingCharge  Int
  discountAmount  Int           @default(0)
  totalAmount     Int
  currency        String        @default("BDT") @db.Char(3)
  orderStatus     OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   PaymentMethod @default(COD)
  customerNotes   String?
  cancelReason    String?
  cancelledAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  items           OrderItem[]

  @@index([userId, createdAt])
  @@index([orderNumber])
}

model OrderItem {
  id           String   @id @default(uuid()) @db.Uuid
  orderId      String   @db.Uuid
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId    String?  @db.Uuid
  product      Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  productName  String   @db.VarChar(200)
  sku          String   @db.VarChar(100)
  productImage String?
  unitPrice    Int
  quantity     Int
  lineTotal    Int
  createdAt    DateTime @default(now())

  @@index([orderId])
}
```

---

## 3. Historical Invariance
Orders are historical business contracts. Future modifications to product titles, prices, descriptions, or customer addresses must never retroactively alter past receipts.
- **Address Snapshot**: Stored as a complete immutable JSON object on the `Order` record.
- **Item Snapshots**: `OrderItem` stores the product name, SKU, primary image URL, and unit price as they existed at the exact moment of order placement.
- **Foreign Key Soft Handling**: If a product is later deleted or archived, `productId` is set to null (`onDelete: SetNull`), preserving the invoice record intact.

---

## 4. Cash on Delivery (COD) Invariant
COD orders are placed with:
- `paymentMethod = "COD"`
- `paymentStatus = "PENDING"`
- `orderStatus = "PENDING"`

COD orders are **never** marked as `PAID` upon placement. Payment status only transitions to `PAID` upon courier cash collection confirmation.

---

## 5. Controlled Order Cancellation
Customers can request online cancellation for orders in `PENDING` or `CONFIRMED` status:
- Orders in `SHIPPED` or `DELIVERED` status cannot be cancelled online.
- When an order is cancelled:
  1. `orderStatus` is set to `CANCELLED`.
  2. Cancellation reason and timestamp are recorded.
  3. The reserved figurine stock is atomically restored to `Inventory.quantity` via `increment: item.quantity`.

