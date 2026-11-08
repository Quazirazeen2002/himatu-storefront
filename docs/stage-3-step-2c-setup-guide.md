# HIMATU — Stage 3 Step 2C Setup & Environment Guide
## Payment Gateways & Custom 3D Printing Configuration

---

## 1. Environment Variables

Add the following variables to `.env` or deployment configuration:

### bKash Merchant Configuration
```env
# bKash Merchant Credentials
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
BKASH_IS_LIVE=false # Set to true for live tokenized gateway
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
```

### SSLCOMMERZ Hosted Checkout Configuration
```env
# SSLCOMMERZ Merchant Credentials
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWD=your_store_passwd
SSLCOMMERZ_IS_LIVE=false # Set to true for securepay.sslcommerz.com
SSLCOMMERZ_BASE_URL=https://sandbox.sslcommerz.com
```

### Application URLs
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:4000/api/v1
```

---

## 2. Supabase Storage Setup

Ensure the following buckets are configured in your Supabase project:
1. `product-images`: Public bucket for catalogue figurine photographs.
2. `custom-print-references`: Private bucket for bespoke 3D print reference photos.

---

## 3. Database Migration & Prisma Generation

```bash
# Apply Prisma migration
npm run migrate -w @himatu/api

# Generate updated Prisma client
npm run generate -w @himatu/api

# Build shared types
npm run build -w @himatu/shared
```

---

## 4. Running the Development Environment

```bash
# Terminal 1: NestJS API Server (Port 4000)
npm run dev -w @himatu/api

# Terminal 2: Next.js Frontend (Port 3000)
npm run dev -w @himatu/web
```

