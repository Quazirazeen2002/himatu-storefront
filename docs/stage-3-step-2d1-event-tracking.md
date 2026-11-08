# HIMATU Business Intelligence Center — First-Party Event Tracking & Funnel Telemetry
## Stage 3 Step 2D.1: Telemetry Foundation, Privacy & Conversion Analytics

---

## 1. Overview & Privacy Mandate

Stage 3 Step 2D.1 introduces a privacy-first, first-party telemetry system for the HIMATU storefront. The goal is to provide authentic conversion funnel analytics without relying on third-party tracking scripts (Google Analytics, Meta Pixel) that can compromise customer privacy or trigger ad-blocker dropouts.

### Privacy Safeguards
- **Zero PII**: Passwords, tokens, phone numbers, email addresses, and full street addresses are systematically stripped before persistence.
- **Anonymous Session Identifiers**: Each visitor receives an ephemeral anonymous session identifier (`himatu_sid`) stored in `sessionStorage` or cookies.
- **Payload Limits**: Event ingestion enforces strict payload limits (16 KB) and validation pipes.
- **Authoritative Reconciliation**: Frontend `purchase_completed` events are treated as client telemetry only; financial and conversion statistics are reconciled against authoritative database orders (`Order` table).

---

## 2. Event Schema & Database Indexing

```prisma
model AnalyticsEvent {
  id         String   @id @default(uuid()) @db.Uuid
  eventName  String   @db.VarChar(100)
  sessionId  String   @db.VarChar(128)
  userId     String?  @db.Uuid
  productId  String?  @db.Uuid
  categoryId String?  @db.Uuid
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([eventName, createdAt])
  @@index([sessionId])
  @@index([userId])
  @@index([productId])
  @@index([categoryId])
}
```

---

## 3. Storefront Telemetry Events

| Event Name | Trigger Point | Metadata Captured |
| :--- | :--- | :--- |
| `storefront_session_started` | Visitor lands on any storefront page for the first time in a session | Anonymous session ID, User-Agent, referrer |
| `product_viewed` | Figurine detail page (`/products/[slug]`) mounted | Product ID, Category ID |
| `add_to_cart` | Collector clicks "Add to Bag" | Product ID, quantity added |
| `checkout_started` | Collector initiates checkout (`/checkout`) | Item count, estimated total amount |
| `purchase_completed` | Order successfully committed to database | Order number, total BDT amount |

---

## 4. Funnel Drop-off & Conversion Progression

```
[Stage 1: Storefront Sessions]
      │
      ▼ (Step Conversion: Sessions ──► Product Views)
[Stage 2: Product Detail Views]
      │
      ▼ (Step Conversion: Views ──► Added to Bag)
[Stage 3: Added to Bag]
      │
      ▼ (Step Conversion: Bag ──► Checkout Initiated)
[Stage 4: Checkout Initiated]
      │
      ▼ (Step Conversion: Checkout ──► Authoritative Purchase)
[Stage 5: Completed Purchases]
```

### Historical Data Disclosure
Because first-party telemetry commenced on **November 8, 2026**, the reporting console explicitly marks historical reporting ranges with:
> **Telemetry Active Since: November 8, 2026**  
> Selected reporting period precedes telemetry activation. Telemetry records began on November 8, 2026.

No synthetic or fabricated visitor traffic is backfilled for historical periods.

