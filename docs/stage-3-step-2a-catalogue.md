# HIMATU — Stage 3 Step 2A: Product Catalogue & Inventory Architecture

## 1. Executive Summary
This document specifies the PostgreSQL-backed product catalogue and inventory management system implemented for HIMATU, a premium anime figures and collectibles e-commerce platform in Bangladesh.

The system replaces hardcoded mock catalogue records with a fully normalized, relational schema in Supabase PostgreSQL, orchestrated via Prisma ORM 7.x, NestJS 12.x backend, and Next.js 16 storefront.

---

## 2. Database Schema Design

### 2.1 Product Model
```prisma
model Product {
  id               String         @id @default(uuid()) @db.Uuid
  name             String         @db.VarChar(200)
  slug             String         @unique @db.VarChar(220)
  sku              String         @unique @db.VarChar(100)
  shortDescription String?        @db.VarChar(500)
  description      String
  price            Int            // BDT integer units (e.g. 6500)
  salePrice        Int?           // Optional sale price in BDT
  currency         String         @default("BDT") @db.Char(3)
  categoryId       String         @db.Uuid
  category         Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  specifications   Json?          // Key-value specifications: Scale, Height, Material, Series
  isActive         Boolean        @default(true)
  isFeatured       Boolean        @default(false)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  images           ProductImage[]
  inventory        Inventory?
  cartItems        CartItem[]
  wishlistItems    WishlistItem[]
  orderItems       OrderItem[]

  @@index([categoryId, isActive])
  @@index([isFeatured, isActive])
}
```

### 2.2 Category Model
```prisma
model Category {
  id           String    @id @default(uuid()) @db.Uuid
  name         String    @db.VarChar(120)
  slug         String    @unique @db.VarChar(160)
  description  String?
  imageUrl     String?
  isActive     Boolean   @default(true)
  displayOrder Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  products     Product[]

  @@index([isActive, displayOrder])
}
```

### 2.3 Inventory Model & Concurrency Safety
Inventory is intentionally decoupled from product descriptive records to isolate high-concurrency stock operations:
```prisma
model Inventory {
  id               String   @id @default(uuid()) @db.Uuid
  productId        String   @unique @db.Uuid
  product          Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity         Int      @default(0)
  reservedQuantity Int      @default(0)
  updatedAt        DateTime @updatedAt
}
```

#### Rules enforced:
- **Available Quantity**: Calculated dynamically as `quantity - reservedQuantity`.
- **Negative Stock Prevention**: Attempting to set `quantity < 0` or `reservedQuantity < 0` throws `BadRequestException`.
- **Reserved Cap**: `reservedQuantity` can never exceed total `quantity`.

---

## 3. Seeded Anime Figurines & Provenance
Initial catalogue seeded into PostgreSQL:
1. **Luffy · Gear Five** (`straw-hat-captain`): SKU `HMT-OP-LGF-001`, ৳6,500 (Sale: ৳5,900), Stock: 12.
2. **Zoro · Three Sword Style** (`zoro-three-sword-style`): SKU `HMT-OP-Z3S-002`, ৳4,800, Stock: 8.
3. **Ace · Chibi Figure** (`ace-chibi`): SKU `HMT-OP-ACE-003`, ৳7,200 (Sale: ৳6,800), Stock: 15.
4. **Zoro · Asura Display** (`zoro-asura`): SKU `HMT-OP-ZAS-004`, ৳5,900, Stock: 6.
5. **Sanji · Chibi Figure** (`sanji-chibi`): SKU `HMT-OP-SAN-005`, ৳6,200, Stock: 10.
6. **Luffy · Gear Five Action** (`luffy-gear-five-action`): SKU `HMT-OP-LGA-006`, ৳6,500, Stock: 7.
7. **Demon Slayer · Hashira Collection** (`demon-slayer-hashira`): SKU `HMT-DS-HAS-007`, ৳7,800 (Sale: ৳7,200), Stock: 5.

