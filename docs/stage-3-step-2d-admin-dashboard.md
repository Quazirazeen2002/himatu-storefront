# HIMATU — STAGE 3 STEP 2D
# STORE OWNER CONTROL CENTER (ADMIN DASHBOARD)

## 1. Overview & Architectural Philosophy

The HIMATU administrative console is redesigned as a **Shopify × Vercel Hybrid**:
- **Shopify's operational clarity**: Organized hierarchical sidebar, actionable business KPIs, readable data tables, contextual order fulfillment actions, and human-friendly terminology.
- **Vercel's minimalist precision**: High-contrast typography, restrained color palette, subtle 1px border lines (`#E5E7EB`), refined light surface canvas (`#F8F9FA`), and collapsible navigation.
- **HIMATU Brand Identity**: Nike-inspired bold header typography, collectible figure photography, and restrained red accents (`#D92727`).

The control center is engineered for the **store owner**, abstracting away database IDs, JSON payloads, and technical jargon in favor of intuitive commerce actions.

---

## 2. Navigation Architecture

```
/admin
├── Dashboard Overview (/admin)
├── CATALOGUE
│   ├── Products (/admin/products)
│   ├── Categories (/admin/categories)
│   ├── Media Library (/admin/media)
│   └── Inventory Control (/admin/inventory)
├── SALES & FULFILLMENT
│   ├── Orders (/admin/orders)
│   └── Payments & COD Settlements (/admin/payments)
├── CUSTOMERS & CUSTOM SERVICES
│   ├── Customers Directory (/admin/customers)
│   └── Custom 3D Printing (/admin/3d-printing)
└── CONFIGURATION
    └── Store Settings (/admin/settings)
```

### Collapsible & Responsive Navigation
- **Desktop Sidebar**: 250px fixed luxury dark sidebar (`#111111`) with white navigation labels, active left red indicator bar, and a persistent toggle that collapses to a 72px icon-only rail with tooltips (persisted in `localStorage`).
- **Header Breadcrumbs & Real-time Context**: Shows active section, today's date in `Asia/Dhaka` (BST), direct "View Storefront ↗" shortcut, and store owner avatar pill.
- **Mobile Drawer**: Slide-out navigation drawer toggled via hamburger menu on viewports below 768px.

---

## 3. Real-Time Business Analytics & KPIs

All dashboard metrics are queried live from Supabase PostgreSQL records via NestJS `AdminService`:

1. **Collected Sales**: Total confirmed revenue collected from delivered or paid orders (`paymentStatus === "PAID"` or `orderStatus === "DELIVERED"`).
2. **Pending COD in Transit**: Orders placed via Cash on Delivery that have not yet been marked delivered/settled.
3. **Today's Sales (BST)**: Sales recorded today evaluated against Bangladesh Standard Time (`Asia/Dhaka` day boundary).
4. **Total Orders**: Lifetime genuine customer orders.
5. **Pending Orders**: Orders in `PENDING` state requiring owner verification and courier dispatch.
6. **Active Figures**: Authentic anime collectible figures currently visible on the storefront.
7. **Low Stock Alerts**: Figures with inventory quantities $\le 5$ units remaining.

---

## 4. Workspaces & Functional Capabilities

### A. Dashboard Overview (`/admin`)
- Dynamic greeting ("Good morning/afternoon/evening, [Owner Name]").
- 6 primary KPI metric cards.
- Daily revenue velocity bar visualization distinguishing confirmed revenue from pending COD.
- **Owner Action Centre**: Contextual callout cards alerting the owner to pending orders, low stock items, or fast catalogue shortcuts.
- **Recent Orders Table**: Direct view of latest customer purchases with status badges.
- **Best-Selling Figures**: Aggregated units sold and revenue from authentic `OrderItem` records.

### B. Products Catalogue (`/admin/products`)
- Clean data table with figure image, SKU, category, price in BDT, stock count, and active status.
- Search by product name or SKU.
- Category filter and stock sorting.
- **+ Add Product Workflow**: Tabbed creation interface with basic info, pricing, initial inventory, specifications, and Supabase Storage photo dropzone.

### C. Categories Manager (`/admin/categories`)
- Manages anime universes (One Piece, Naruto, Dragon Ball, Jujutsu Kaisen, Demon Slayer, Other Anime).
- Add new category, edit name, unique slug, description, display order, and storefront visibility.

### D. Media Library (`/admin/media`)
- Centralized catalogue gallery displaying images uploaded to the dedicated Supabase Storage bucket (`product-images`).
- Product association, primary image badge, copy URL reference action, and lightbox preview.

### E. Inventory Control (`/admin/inventory`)
- Real-time stock levels: Total Quantity, Reserved Quantity, Available Stock.
- Filtering by All, Low Stock ($\le 5$), and Out of Stock ($0$).
- Modal for instantaneous stock updates via `POST /api/v1/admin/inventory/:productId/adjust`.

### F. Orders & Fulfillment (`/admin/orders`)
- Status tabs: `ALL`, `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- Search by order number, customer name, email, or phone.
- **Interactive Order Details Drawer**:
  - Full delivery address in Bangladesh.
  - Figure line items with SKU, unit price, quantity, and line totals.
  - Contextual status transition actions:
    - `PENDING` $\to$ `CONFIRMED`
    - `CONFIRMED` $\to$ `PROCESSING`
    - `PROCESSING` $\to$ `SHIPPED`
    - `SHIPPED` $\to$ `DELIVERED` (automatically marks Cash on Delivery as `PAID`)
    - Cancellation modal requiring cancellation reason, which automatically restores inventory quantities.

### G. Payments & Settlements (`/admin/payments`)
- Financial breakdown of Cash on Delivery payments vs settled revenue.
- Gateway configuration notes indicating active COD and future roadmap for bKash and SSLCOMMERZ.

### H. Customer Directory (`/admin/customers`)
- Verified collector profiles, email, phone, member registration date, order count, and lifetime spend in BDT.
- Detail drawer displaying customer's saved shipping addresses and order history.

### I. Custom 3D Printing (`/admin/3d-printing`)
- Operations workspace for customer SLA/resin 3D printing inquiries.
- Foundation for customer STL uploads, resin weight slicing, quotation, and custom painting.

### J. Store Settings (`/admin/settings`)
- Brand details, customer support phone, email, and Dhaka business address.
- Inside Dhaka shipping rate (৳80), Outside Dhaka shipping rate (৳150), and Free Shipping threshold (৳10,000).
- Low stock threshold and operating hours.
- Persisted live via `PATCH /api/v1/admin/settings`.

