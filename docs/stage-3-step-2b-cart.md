# HIMATU — Stage 3 Step 2B: Persistent Cart & Wishlist Architecture

## 1. Executive Summary
This document specifies the server-side, PostgreSQL-persisted Cart and Wishlist engines implemented for HIMATU.

Previously, shopping bag and wishlist selections were stored solely in ephemeral browser local memory. The new architecture makes PostgreSQL the authoritative source of truth. Customer carts and wishlists survive device switches, page reloads, and logout/login cycles.

---

## 2. Relational Database Schema

### 2.1 Cart & CartItem
```prisma
model Cart {
  id        String      @id @default(uuid()) @db.Uuid
  userId    String      @unique @db.Uuid
  user      UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  items     CartItem[]
}

model CartItem {
  id        String   @id @default(uuid()) @db.Uuid
  cartId    String   @db.Uuid
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String   @db.Uuid
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([cartId, productId])
  @@index([cartId])
}
```

### 2.2 Wishlist & WishlistItem
```prisma
model Wishlist {
  id        String         @id @default(uuid()) @db.Uuid
  userId    String         @unique @db.Uuid
  user      UserProfile    @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  items     WishlistItem[]
}

model WishlistItem {
  id         String   @id @default(uuid()) @db.Uuid
  wishlistId String   @db.Uuid
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  productId  String   @db.Uuid
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([wishlistId, productId])
  @@index([wishlistId])
}
```

---

## 3. Business Logic & Invariants

1. **Authentication Boundary**: All cart and wishlist operations require a verified customer JWT. Client-supplied user IDs in query parameters or request bodies are strictly rejected; identity is resolved through the server-verified session.
2. **Atomic Quantity Increment**: Adding an item that already exists in the cart increments the existing `quantity` instead of creating duplicate records (`@@unique([cartId, productId])`).
3. **Server-Side Pricing**: Prices are never accepted from the frontend. The backend queries current prices and sale prices directly from the database and calculates line totals dynamically.
4. **Stock Validation**: Adding or updating an item checks the available stock (`quantity - reservedQuantity`). If the requested quantity exceeds available inventory, the request is rejected with `ConflictException`.
5. **Stock Warning Flag**: If an item in the cart has a quantity higher than current stock (due to concurrent purchases by other customers), `hasStockIssue: true` is returned on `GET /api/v1/cart`.

