# HIMATU — Stage 3 Step 2A: Catalogue & Storage API Specification

## 1. Public Endpoints

### 1.1 `GET /api/v1/categories`
Returns active product categories with count of available figures, sorted by display order.

### 1.2 `GET /api/v1/categories/:slug/products`
Returns figures belonging to the specified category slug with pagination.

### 1.3 `GET /api/v1/products`
Query parameters:
- `page` (number, default: 1)
- `limit` (number, default: 12, max: 50)
- `search` (string, searches name, description, SKU)
- `category` (string, category slug or UUID)
- `minPrice`, `maxPrice` (numbers in BDT)
- `sort` (`price_asc` | `price_desc` | `new` | `name`)
- `featured` (`true` | `false`)

### 1.4 `GET /api/v1/products/:slug`
Returns full product details, category relationship, ordered gallery photographs, specifications JSON, and available inventory.

---

## 2. Administrative Endpoints
Requires verified `ADMIN` role JWT (`Authorization: Bearer <token>`).

### 2.1 `GET /api/v1/admin/products`
Lists all products including archived/inactive items with stock levels.

### 2.2 `POST /api/v1/admin/products`
Body validated via `CreateProductSchema`. Creates product and initial inventory transactionally.

### 2.3 `PATCH /api/v1/admin/products/:id`
Updates product metadata, pricing, category, and specifications.

### 2.4 `DELETE /api/v1/admin/products/:id`
Soft-archives the product (`isActive: false`) preserving historical order foreign keys.

### 2.5 `POST /api/v1/admin/inventory/:productId/adjust`
Adjusts total and reserved stock. Validates non-negative constraints.

### 2.6 `POST /api/v1/admin/products/:productId/images`
Accepts `multipart/form-data` with up to 10 images. Uploads to Supabase Storage and records database entries.

### 2.7 `PATCH /api/v1/admin/products/:productId/images/:imageId`
Updates alt text and primary status.

### 2.8 `PATCH /api/v1/admin/products/:productId/images/reorder`
Reorders images according to supplied `sortOrder` values.

### 2.9 `DELETE /api/v1/admin/products/:productId/images/:imageId`
Deletes photograph from Supabase Storage and database.

