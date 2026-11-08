import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Proxy or direct DB fallback for commerce API endpoints
 */
async function forwardToBackend(request: NextRequest, slug: string[]) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return null;

  try {
    const path = slug.join("/");
    const search = request.nextUrl.search;
    const targetUrl = `${apiUrl}/api/v1/${path}${search}`;

    const headers = new Headers(request.headers);
    headers.delete("host");

    const options: RequestInit = {
      method: request.method,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      options.body = await request.clone().arrayBuffer();
    }

    const response = await fetch(targetUrl, options);
    const data = await response.arrayBuffer();

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    // API backend unreachable, fall through to direct DB fallback
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;

  // Try proxy first
  const proxied = await forwardToBackend(request, slug);
  if (proxied) return proxied;

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const path = slug.join("/");
  const url = request.nextUrl;

  try {
    // 1. /admin/orders
    if (path === "admin/orders") {
      const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
      const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || "20")));
      const status = url.searchParams.get("status");
      const search = url.searchParams.get("search")?.trim();
      const skip = (page - 1) * limit;

      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (status && status !== "ALL") {
        conditions.push(`o."orderStatus" = $${paramIndex++}`);
        values.push(status);
      }

      if (search) {
        conditions.push(
          `(o."orderNumber" ILIKE $${paramIndex} OR u."fullName" ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
        );
        values.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const countRes = await pool.query(
        `SELECT COUNT(*) as total FROM "Order" o LEFT JOIN "UserProfile" u ON o."userId" = u.id ${whereClause}`,
        values
      );
      const total = Number(countRes.rows[0]?.total || 0);

      const ordersRes = await pool.query(
        `SELECT o.*, u.email as "userEmail", u."fullName" as "userName"
         FROM "Order" o
         LEFT JOIN "UserProfile" u ON o."userId" = u.id
         ${whereClause}
         ORDER BY o."createdAt" DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...values, limit, skip]
      );

      const orderIds = ordersRes.rows.map((r) => r.id);
      let itemsByOrder: Record<string, any[]> = {};

      if (orderIds.length > 0) {
        const itemsRes = await pool.query(
          `SELECT * FROM "OrderItem" WHERE "orderId" = ANY($1::uuid[])`,
          [orderIds]
        );
        for (const item of itemsRes.rows) {
          if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
          itemsByOrder[item.orderId].push({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            productImage: item.productImage,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
          });
        }
      }

      const formatted = ordersRes.rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        userId: o.userId,
        addressSnapshot: o.addressSnapshot,
        subtotal: o.subtotal,
        shippingCharge: o.shippingCharge,
        discountAmount: o.discountAmount || 0,
        totalAmount: o.totalAmount,
        currency: o.currency || "BDT",
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        customerNotes: o.customerNotes,
        cancelReason: o.cancelReason,
        cancelledAt: o.cancelledAt ? new Date(o.cancelledAt).toISOString() : null,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : new Date().toISOString(),
        items: itemsByOrder[o.id] || [],
      }));

      return NextResponse.json({
        items: formatted,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    }

    // 2. /admin/dashboard/summary
    if (path === "admin/dashboard/summary") {
      const ordersRes = await pool.query(
        `SELECT "totalAmount", "orderStatus", "paymentStatus", "createdAt" FROM "Order"`
      );
      const orders = ordersRes.rows;

      let totalSales = 0;
      let pendingSales = 0;
      let todaySales = 0;
      let todayOrdersCount = 0;
      let pendingOrders = 0;
      let confirmedOrders = 0;
      let shippedOrders = 0;
      let deliveredOrders = 0;
      let cancelledOrders = 0;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      for (const o of orders) {
        const orderDate = new Date(o.createdAt);
        const isToday = orderDate >= startOfDay;

        if (o.orderStatus === "CANCELLED") {
          cancelledOrders++;
        } else if (o.orderStatus === "DELIVERED") {
          deliveredOrders++;
          totalSales += o.totalAmount;
          if (isToday) todaySales += o.totalAmount;
        } else if (o.orderStatus === "SHIPPED") {
          shippedOrders++;
          if (o.paymentStatus === "PAID") totalSales += o.totalAmount;
          else pendingSales += o.totalAmount;
        } else if (o.orderStatus === "CONFIRMED") {
          confirmedOrders++;
          if (o.paymentStatus === "PAID") totalSales += o.totalAmount;
          else pendingSales += o.totalAmount;
        } else {
          pendingOrders++;
          pendingSales += o.totalAmount;
        }

        if (isToday && o.orderStatus !== "CANCELLED") {
          todayOrdersCount++;
        }
      }

      const activeOrders = pendingOrders + confirmedOrders + shippedOrders;
      const countFigures = await pool.query(`SELECT COUNT(*) as total FROM "Product" WHERE "isActive" = true`);
      const totalFigures = Number(countFigures.rows[0]?.total || 0);

      const countCustomers = await pool.query(`SELECT COUNT(*) as total FROM "UserProfile" WHERE role = 'CUSTOMER'`);
      const totalCustomers = Number(countCustomers.rows[0]?.total || 0);

      const lowStockRes = await pool.query(`SELECT COUNT(*) as total FROM "Inventory" WHERE quantity <= 5`);
      const lowStockCount = Number(lowStockRes.rows[0]?.total || 0);

      return NextResponse.json({
        totalSales,
        pendingSales,
        todaySales,
        todayOrdersCount,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        activeOrders,
        totalFigures,
        totalCustomers,
        lowStockCount,
      });
    }

    // 3. /admin/dashboard/revenue
    if (path === "admin/dashboard/revenue") {
      const period = url.searchParams.get("period") || "30d";
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const ordersRes = await pool.query(
        `SELECT "totalAmount", "orderStatus", "paymentStatus", "createdAt"
         FROM "Order"
         WHERE "createdAt" >= $1 AND "orderStatus" != 'CANCELLED'
         ORDER BY "createdAt" ASC`,
        [startDate]
      );

      const dayMap: Record<string, { confirmedRevenue: number; pendingRevenue: number; orderCount: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        dayMap[d.toISOString().slice(0, 10)] = { confirmedRevenue: 0, pendingRevenue: 0, orderCount: 0 };
      }

      for (const o of ordersRes.rows) {
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        if (!dayMap[key]) dayMap[key] = { confirmedRevenue: 0, pendingRevenue: 0, orderCount: 0 };
        dayMap[key].orderCount++;
        if (o.paymentStatus === "PAID" || o.orderStatus === "DELIVERED") {
          dayMap[key].confirmedRevenue += o.totalAmount;
        } else {
          dayMap[key].pendingRevenue += o.totalAmount;
        }
      }

      const points = Object.entries(dayMap).map(([date, data]) => ({
        date,
        confirmedRevenue: data.confirmedRevenue,
        pendingRevenue: data.pendingRevenue,
        orderCount: data.orderCount,
      }));

      return NextResponse.json(points);
    }

    // 4. /admin/dashboard/top-products
    if (path === "admin/dashboard/top-products") {
      const limit = Number(url.searchParams.get("limit") || "5");
      const topRes = await pool.query(
        `SELECT oi."productId", oi."productName", oi.sku, oi."productImage",
                SUM(oi.quantity) as "unitsSold", SUM(oi."lineTotal") as revenue
         FROM "OrderItem" oi
         JOIN "Order" o ON oi."orderId" = o.id
         WHERE o."orderStatus" != 'CANCELLED'
         GROUP BY oi."productId", oi."productName", oi.sku, oi."productImage"
         ORDER BY revenue DESC
         LIMIT $1`,
        [limit]
      );

      return NextResponse.json(
        topRes.rows.map((r) => ({
          productId: r.productId,
          productName: r.productName,
          sku: r.sku,
          productImage: r.productImage,
          unitsSold: Number(r.unitsSold || 0),
          revenue: Number(r.revenue || 0),
        }))
      );
    }

    // 5. /admin/payments
    if (path === "admin/payments") {
      const res = await pool.query(
        `SELECT pt.*, o."orderNumber", u.email as "userEmail", u."fullName" as "userName"
         FROM "PaymentTransaction" pt
         LEFT JOIN "Order" o ON pt."orderId" = o.id
         LEFT JOIN "UserProfile" u ON pt."userId" = u.id
         ORDER BY pt."createdAt" DESC
         LIMIT 50`
      );
      return NextResponse.json({
        items: res.rows.map((r) => ({
          ...r,
          amount: Number(r.amount),
          createdAt: new Date(r.createdAt).toISOString(),
          updatedAt: new Date(r.updatedAt).toISOString(),
        })),
        total: res.rows.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    }

    // 6. /admin/payments/summary
    if (path === "admin/payments/summary") {
      const res = await pool.query(`SELECT status, amount FROM "PaymentTransaction"`);
      let totalCollected = 0;
      let pendingAmount = 0;
      let successfulCount = 0;
      let failedCount = 0;

      for (const row of res.rows) {
        const amt = Number(row.amount);
        if (row.status === "PAID" || row.status === "COMPLETED") {
          totalCollected += amt;
          successfulCount++;
        } else if (row.status === "FAILED") {
          failedCount++;
        } else {
          pendingAmount += amt;
        }
      }

      return NextResponse.json({
        totalCollected,
        pendingAmount,
        refundAmount: 0,
        successfulCount,
        failedCount,
      });
    }

    // 7. /admin/settings
    if (path === "admin/settings") {
      return NextResponse.json({
        storeName: "HIMATU Anime Collectibles",
        contactEmail: "concierge@himatu.com",
        contactPhone: "+880 1711-000000",
        businessAddress: "Banani Road 11, Dhaka 1213, Bangladesh",
        insideDhakaShipping: 80,
        outsideDhakaShipping: 150,
        freeShippingThreshold: 10000,
        lowStockThreshold: 5,
        currency: "BDT",
        operatingHours: "10:00 AM – 9:00 PM BST (Sat – Thu)",
      });
    }

    // 8. /admin/customers
    if (path === "admin/customers") {
      const res = await pool.query(
        `SELECT u.id, u.email, u."fullName", u.phone, u.role, u."createdAt",
                COUNT(o.id) as "totalOrders", COALESCE(SUM(o."totalAmount"), 0) as "totalSpent"
         FROM "UserProfile" u
         LEFT JOIN "Order" o ON u.id = o."userId" AND o."orderStatus" != 'CANCELLED'
         GROUP BY u.id
         ORDER BY u."createdAt" DESC
         LIMIT 50`
      );
      return NextResponse.json({
        items: res.rows.map((r) => ({
          id: r.id,
          email: r.email,
          fullName: r.fullName,
          phone: r.phone,
          role: r.role,
          totalOrders: Number(r.totalOrders || 0),
          totalSpent: Number(r.totalSpent || 0),
          createdAt: new Date(r.createdAt).toISOString(),
        })),
        total: res.rows.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    }

    // 9. /admin/products or /products
    if (path === "admin/products" || path === "products") {
      const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
      const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || "20")));
      const search = url.searchParams.get("search")?.trim();
      const category = url.searchParams.get("category");
      const skip = (page - 1) * limit;

      const conditions: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      if (search) {
        conditions.push(`(p.name ILIKE $${paramIdx} OR p.sku ILIKE $${paramIdx})`);
        values.push(`%${search}%`);
        paramIdx++;
      }

      if (category) {
        conditions.push(`c.slug = $${paramIdx}`);
        values.push(category);
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const countRes = await pool.query(
        `SELECT COUNT(*) as total FROM "Product" p LEFT JOIN "Category" c ON p."categoryId" = c.id ${whereClause}`,
        values
      );
      const total = Number(countRes.rows[0]?.total || 0);

      const res = await pool.query(
        `SELECT p.*, c.name as "categoryName", c.slug as "categorySlug",
                i.quantity as "stockQuantity",
                (SELECT json_agg(img.* ORDER BY img."sortOrder" ASC) FROM "ProductImage" img WHERE img."productId" = p.id) as images
         FROM "Product" p
         LEFT JOIN "Category" c ON p."categoryId" = c.id
         LEFT JOIN "Inventory" i ON p.id = i."productId"
         ${whereClause}
         ORDER BY p."createdAt" DESC
         LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
        [...values, limit, skip]
      );

      return NextResponse.json({
        items: res.rows.map((r) => ({
          ...r,
          images: r.images || [],
          inventory: { quantity: r.stockQuantity || 0, availableQuantity: r.stockQuantity || 0 },
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    }

    // 10. /admin/categories or /categories
    if (path === "admin/categories" || path === "categories") {
      const res = await pool.query(`SELECT * FROM "Category" ORDER BY "displayOrder" ASC`);
      return NextResponse.json(res.rows);
    }

    // 11. /admin/inventory
    if (path === "admin/inventory") {
      const res = await pool.query(
        `SELECT i.*, p.name as "productName", p.sku, p.price, p.slug as "productSlug"
         FROM "Inventory" i
         JOIN "Product" p ON i."productId" = p.id
         ORDER BY i.quantity ASC`
      );
      return NextResponse.json(res.rows);
    }

    // 12. Single product by slug or id
    if (path.startsWith("products/")) {
      const productSlug = path.split("/")[1];
      const res = await pool.query(
        `SELECT p.*, c.name as "categoryName", c.slug as "categorySlug",
                i.quantity as "stockQuantity",
                (SELECT json_agg(img.* ORDER BY img."sortOrder" ASC) FROM "ProductImage" img WHERE img."productId" = p.id) as images
         FROM "Product" p
         LEFT JOIN "Category" c ON p."categoryId" = c.id
         LEFT JOIN "Inventory" i ON p.id = i."productId"
         WHERE p.slug = $1 OR p.id::text = $1
         LIMIT 1`,
        [productSlug]
      );
      if (res.rows.length === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      const p = res.rows[0];
      return NextResponse.json({
        ...p,
        images: p.images || [],
        inventory: { quantity: p.stockQuantity || 0, availableQuantity: p.stockQuantity || 0 },
      });
    }

    // 13. Printing requests
    if (path === "admin/printing/requests" || path === "printing/requests") {
      const res = await pool.query(
        `SELECT pr.*, u.email as "userEmail", u."fullName" as "userName"
         FROM "PrintingRequest" pr
         LEFT JOIN "UserProfile" u ON pr."userId" = u.id
         ORDER BY pr."createdAt" DESC
         LIMIT 50`
      );
      return NextResponse.json({
        items: res.rows.map((r) => ({
          ...r,
          createdAt: new Date(r.createdAt).toISOString(),
          updatedAt: new Date(r.updatedAt).toISOString(),
        })),
        total: res.rows.length,
        page: 1,
        limit: 50,
      });
    }

    // 14. Printing production board
    if (path === "admin/printing/production/board") {
      return NextResponse.json({
        QUEUED: [],
        SLICING: [],
        PRINTING: [],
        POST_PROCESSING: [],
        QUALITY_CHECK: [],
        READY_TO_DISPATCH: [],
      });
    }

    return NextResponse.json({ message: `Path ${path} received` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;

  // Try proxy first
  const proxied = await forwardToBackend(request, slug);
  if (proxied) return proxied;

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const path = slug.join("/");

  try {
    // /admin/orders/:id/status
    if (path.startsWith("admin/orders/") && path.endsWith("/status")) {
      const parts = path.split("/");
      const orderId = parts[2];
      const body = await request.json();
      const { status: newStatus, reason } = body;

      const checkRes = await pool.query(`SELECT * FROM "Order" WHERE id = $1`, [orderId]);
      if (checkRes.rows.length === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const isCancelling = newStatus === "CANCELLED";
      const updateRes = await pool.query(
        `UPDATE "Order"
         SET "orderStatus" = $1,
             "cancelReason" = CASE WHEN $2::text IS NOT NULL THEN $2 ELSE "cancelReason" END,
             "cancelledAt" = CASE WHEN $3::boolean THEN NOW() ELSE "cancelledAt" END,
             "updatedAt" = NOW()
         WHERE id = $4
         RETURNING *`,
        [newStatus, reason || null, isCancelling, orderId]
      );

      // Restore inventory if cancelling
      if (isCancelling) {
        const items = await pool.query(`SELECT "productId", quantity FROM "OrderItem" WHERE "orderId" = $1`, [orderId]);
        for (const item of items.rows) {
          if (item.productId) {
            await pool.query(
              `UPDATE "Inventory" SET quantity = quantity + $1 WHERE "productId" = $2`,
              [item.quantity, item.productId]
            );
          }
        }
      }

      return NextResponse.json(updateRes.rows[0]);
    }

    // /admin/categories/:id
    if (path.startsWith("admin/categories/")) {
      const categoryId = path.split("/")[2];
      const body = await request.json();
      const { name, slug: catSlug, description, displayOrder, isActive } = body;
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
      if (catSlug !== undefined) { updates.push(`slug = $${idx++}`); values.push(catSlug); }
      if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
      if (displayOrder !== undefined) { updates.push(`"displayOrder" = $${idx++}`); values.push(displayOrder); }
      if (isActive !== undefined) { updates.push(`"isActive" = $${idx++}`); values.push(isActive); }
      updates.push(`"updatedAt" = NOW()`);
      values.push(categoryId);
      const res = await pool.query(
        `UPDATE "Category" SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );
      return NextResponse.json(res.rows[0]);
    }

    // /admin/products/:id
    if (path.startsWith("admin/products/")) {
      const productId = path.split("/")[2];
      const body = await request.json();
      const {
        name,
        slug: prodSlug,
        sku,
        shortDescription,
        description,
        price,
        salePrice,
        categoryId,
        isActive,
        isFeatured,
        specifications,
      } = body;
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
      if (prodSlug !== undefined) { updates.push(`slug = $${idx++}`); values.push(prodSlug); }
      if (sku !== undefined) { updates.push(`sku = $${idx++}`); values.push(sku); }
      if (shortDescription !== undefined) { updates.push(`"shortDescription" = $${idx++}`); values.push(shortDescription); }
      if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
      if (price !== undefined) { updates.push(`price = $${idx++}`); values.push(price); }
      if (salePrice !== undefined) { updates.push(`"salePrice" = $${idx++}`); values.push(salePrice); }
      if (categoryId !== undefined) { updates.push(`"categoryId" = $${idx++}`); values.push(categoryId); }
      if (isActive !== undefined) { updates.push(`"isActive" = $${idx++}`); values.push(isActive); }
      if (isFeatured !== undefined) { updates.push(`"isFeatured" = $${idx++}`); values.push(isFeatured); }
      if (specifications !== undefined) { updates.push(`specifications = $${idx++}`); values.push(JSON.stringify(specifications)); }
      updates.push(`"updatedAt" = NOW()`);
      values.push(productId);
      const res = await pool.query(
        `UPDATE "Product" SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );
      return NextResponse.json(res.rows[0]);
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const proxied = await forwardToBackend(request, slug);
  if (proxied) return proxied;

  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const path = slug.join("/");

  try {
    // /admin/categories
    if (path === "admin/categories" || path === "categories") {
      const body = await request.json();
      const { name, slug: catSlug, description, displayOrder } = body;
      const res = await pool.query(
        `INSERT INTO "Category" (id, name, slug, description, "displayOrder", "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
         RETURNING *`,
        [name, catSlug, description || null, displayOrder || 0]
      );
      return NextResponse.json(res.rows[0], { status: 201 });
    }

    // /admin/products
    if (path === "admin/products" || path === "products") {
      const body = await request.json();
      const {
        name,
        slug: prodSlug,
        sku,
        shortDescription,
        description,
        price,
        salePrice,
        categoryId,
        isActive,
        isFeatured,
        initialStock,
        specifications,
      } = body;

      const prodRes = await pool.query(
        `INSERT INTO "Product" (id, name, slug, sku, "shortDescription", description, price, "salePrice", "categoryId", "isActive", "isFeatured", specifications, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING *`,
        [
          name,
          prodSlug,
          sku,
          shortDescription || null,
          description,
          price,
          salePrice || null,
          categoryId,
          isActive ?? true,
          isFeatured ?? false,
          JSON.stringify(specifications || {}),
        ]
      );
      const newProd = prodRes.rows[0];

      if (initialStock !== undefined) {
        await pool.query(
          `INSERT INTO "Inventory" (id, "productId", quantity, "reservedQuantity", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, 0, NOW(), NOW())`,
          [newProd.id, initialStock]
        );
      }

      return NextResponse.json(newProd, { status: 201 });
    }

    // /admin/inventory/:productId/adjust
    if (path.startsWith("admin/inventory/") && path.endsWith("/adjust")) {
      const productId = path.split("/")[2];
      const body = await request.json();
      const { quantity, reservedQuantity } = body;
      const check = await pool.query(`SELECT id FROM "Inventory" WHERE "productId" = $1`, [productId]);
      let res;
      if (check.rows.length > 0) {
        res = await pool.query(
          `UPDATE "Inventory" SET quantity = $1, "reservedQuantity" = COALESCE($2, "reservedQuantity"), "updatedAt" = NOW() WHERE "productId" = $3 RETURNING *`,
          [quantity, reservedQuantity ?? null, productId]
        );
      } else {
        res = await pool.query(
          `INSERT INTO "Inventory" (id, "productId", quantity, "reservedQuantity", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, COALESCE($3, 0), NOW(), NOW()) RETURNING *`,
          [productId, quantity, reservedQuantity ?? 0]
        );
      }
      return NextResponse.json(res.rows[0]);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const proxied = await forwardToBackend(request, slug);
  if (proxied) return proxied;

  const pool = getDbPool();
  if (!pool) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const path = slug.join("/");
  if (path.startsWith("admin/products/")) {
    const productId = path.split("/")[2];
    const res = await pool.query(
      `UPDATE "Product" SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [productId]
    );
    return NextResponse.json(res.rows[0]);
  }

  return NextResponse.json({ ok: true });
}
