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

  // /admin/orders/:id/status
  if (path.startsWith("admin/orders/") && path.endsWith("/status")) {
    const parts = path.split("/");
    const orderId = parts[2];
    const body = await request.json();
    const { status: newStatus, reason } = body;

    try {
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
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const proxied = await forwardToBackend(request, slug);
  if (proxied) return proxied;

  return NextResponse.json({ ok: true });
}
