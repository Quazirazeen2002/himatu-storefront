"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Package,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  Truck,
  Sparkles,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import {
  getAdminDashboardSummary,
  getAdminRevenue,
  getAdminTopProducts,
  getAdminOrders,
} from "@/lib/commerce-api";
import type {
  AdminDashboardSummaryDto,
  AdminRevenuePointDto,
  AdminTopProductDto,
  OrderDto,
} from "@himatu/shared";

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  let timeStr = "Good morning";
  if (hour >= 12 && hour < 17) timeStr = "Good afternoon";
  else if (hour >= 17) timeStr = "Good evening";
  const firstName = name ? name.split(" ")[0] : "Store Owner";
  return `${timeStr}, ${firstName}`;
}

export function AdminDashboardOverview() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"all" | "7d" | "30d" | "90d">("30d");

  const [summary, setSummary] = useState<AdminDashboardSummaryDto | null>(null);
  const [revenuePoints, setRevenuePoints] = useState<AdminRevenuePointDto[]>([]);
  const [topProducts, setTopProducts] = useState<AdminTopProductDto[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderDto[]>([]);

  const loadData = async (token: string, selectedPeriod = period) => {
    try {
      const [sum, rev, top, ordersData] = await Promise.all([
        getAdminDashboardSummary(token, selectedPeriod),
        getAdminRevenue(token, selectedPeriod === "all" ? "30d" : selectedPeriod),
        getAdminTopProducts(token, 5),
        getAdminOrders(token, { limit: 5 }),
      ]);
      setSummary(sum);
      setRevenuePoints(rev);
      setTopProducts(top);
      setRecentOrders(ordersData.items);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  useEffect(() => {
    let active = true;
    authService.getSession().then(async (s) => {
      if (!active) return;
      setSession(s);
      if (s?.accessToken && s.user.role === "ADMIN") {
        await loadData(s.accessToken);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    if (!session?.accessToken) return;
    setRefreshing(true);
    await loadData(session.accessToken, period);
    setRefreshing(false);
  };

  const handlePeriodChange = async (newPeriod: "all" | "7d" | "30d" | "90d") => {
    setPeriod(newPeriod);
    if (session?.accessToken) {
      setRefreshing(true);
      await loadData(session.accessToken, newPeriod);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <p style={{ fontWeight: 700, color: "var(--admin-muted)" }}>
          LOADING BUSINESS CONTROL METRICS…
        </p>
      </div>
    );
  }

  const formatBDT = (amount: number) =>
    `৳${new Intl.NumberFormat("en-BD").format(amount)}`;

  const maxRev = Math.max(
    1,
    ...revenuePoints.map((p) => p.confirmedRevenue + p.pendingRevenue),
  );

  return (
    <div>
      {/* Section A: Welcome Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>{getGreeting(session?.user.fullName || "")}</h1>
          <p>Here’s the current business situation for HIMATU in Bangladesh.</p>
        </div>

        <div className="admin-page-actions">
          <div style={{ display: "flex", gap: "4px", background: "#ffffff", padding: "3px", borderRadius: "6px", border: "1px solid var(--admin-border)" }}>
            {(["today", "7d", "30d", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p as any)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: 0,
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  background: (period === p || (p === "today" && period === "all")) ? "#111111" : "transparent",
                  color: (period === p || (p === "today" && period === "all")) ? "#ffffff" : "var(--admin-muted)",
                }}
              >
                {p === "today" ? "Today" : p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh database metrics"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Updating…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Business Intelligence & Analytics Spotlight */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "linear-gradient(135deg, #111111 0%, #1f2937 100%)",
          color: "#ffffff",
          borderRadius: "12px",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.1)",
              color: "#fbbf24",
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Business Intelligence Center Active
              </span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  background: "#d92727",
                  color: "#ffffff",
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                NEW
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
              Explore deep financial analytics, anime collection velocity, conversion funnel telemetry, and AI business insights.
            </p>
          </div>
        </div>

        <Link
          href="/admin/analytics"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#ffffff",
            color: "#111111",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span>Open Analytics</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Section B: 6 Business KPI Cards */}
      <div className="admin-kpi-grid">
        {/* 1. Confirmed Sales */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Collected Sales</span>
            <div className="admin-kpi-icon">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="admin-kpi-value">{formatBDT(summary?.totalSales || 0)}</div>
          <div className="admin-kpi-subtext">
            COD Pending: <strong>{formatBDT(summary?.pendingSales || 0)}</strong>
          </div>
        </div>

        {/* 2. Today's Sales */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Today's Sales (BST)</span>
            <div className="admin-kpi-icon">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="admin-kpi-value">{formatBDT(summary?.todaySales || 0)}</div>
          <div className="admin-kpi-subtext">
            <strong>{summary?.todayOrdersCount || 0}</strong> orders today
          </div>
        </div>

        {/* 3. Total Orders */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Total Orders</span>
            <div className="admin-kpi-icon">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="admin-kpi-value">{summary?.totalOrders || 0}</div>
          <div className="admin-kpi-subtext">
            Delivered: <strong>{summary?.deliveredOrders || 0}</strong>
          </div>
        </div>

        {/* 4. Pending Orders (Operational) */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Pending Orders</span>
            <div className="admin-kpi-icon" style={{ color: "#d97706" }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: summary?.pendingOrders ? "#d97706" : "inherit" }}>
            {summary?.pendingOrders || 0}
          </div>
          <div className="admin-kpi-subtext">
            <Link href="/admin/orders?status=PENDING" style={{ color: "#d97706", textDecoration: "underline", fontWeight: 700 }}>
              Needs action →
            </Link>
          </div>
        </div>

        {/* 5. Active Figures */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Active Figures</span>
            <div className="admin-kpi-icon">
              <Package size={16} />
            </div>
          </div>
          <div className="admin-kpi-value">{summary?.activeProducts || 0}</div>
          <div className="admin-kpi-subtext">
            In store catalogue
          </div>
        </div>

        {/* 6. Low Stock Products */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Low Stock Alert</span>
            <div className="admin-kpi-icon" style={{ color: summary?.lowStockProducts ? "#ef4444" : "inherit" }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: summary?.lowStockProducts ? "#ef4444" : "inherit" }}>
            {summary?.lowStockProducts || 0}
          </div>
          <div className="admin-kpi-subtext">
            {summary?.lowStockProducts ? (
              <Link href="/admin/inventory" style={{ color: "#ef4444", textDecoration: "underline", fontWeight: 700 }}>
                Restock needed →
              </Link>
            ) : (
              "All stock healthy"
            )}
          </div>
        </div>
      </div>

      {/* Section C & E: Revenue Analytics Chart & Action Centre */}
      <div className="admin-grid-2col">
        {/* Left: Revenue Trend */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <h3>Revenue Trend & Order Velocity</h3>
              <p>Daily orders breakdown: Confirmed paid revenue vs pending Cash on Delivery.</p>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--admin-muted)" }}>
              {revenuePoints.length} Days Activity
            </span>
          </div>

          {revenuePoints.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--admin-muted)" }}>
              No order transactions recorded in this period.
            </div>
          ) : (
            <div>
              {/* CSS Visual Bar Chart */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "4px",
                  height: "180px",
                  padding: "10px 0 20px",
                  borderBottom: "1px solid var(--admin-border)",
                }}
              >
                {revenuePoints.map((point) => {
                  const total = point.confirmedRevenue + point.pendingRevenue;
                  const heightPct = Math.max(4, Math.round((total / maxRev) * 100));
                  const isPaid = point.confirmedRevenue > 0;

                  return (
                    <div
                      key={point.date}
                      title={`${point.date}: ${formatBDT(total)} (${point.orderCount} orders)`}
                      style={{
                        flex: 1,
                        height: `${heightPct}%`,
                        background: isPaid ? "#111111" : "#f59e0b",
                        borderRadius: "3px 3px 0 0",
                        minWidth: "6px",
                        position: "relative",
                        transition: "opacity 0.15s ease",
                        cursor: "pointer",
                      }}
                    />
                  );
                })}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", fontSize: "11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", background: "#111111", borderRadius: "2px" }} />
                    <span>Confirmed Collected</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", background: "#f59e0b", borderRadius: "2px" }} />
                    <span>Pending COD</span>
                  </span>
                </div>
                <span style={{ color: "var(--admin-muted)" }}>
                  Peak: <strong>{formatBDT(maxRev)}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Owner Action Centre */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <h3>Action Centre</h3>
              <p>Immediate store operations requiring owner attention.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Action 1: Pending Orders */}
            <div
              style={{
                padding: "14px",
                background: summary?.pendingOrders ? "var(--admin-warning-soft)" : "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <Clock size={18} color={summary?.pendingOrders ? "#d97706" : "#6b7280"} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 800 }}>
                  {summary?.pendingOrders
                    ? `${summary.pendingOrders} Orders Awaiting Confirmation`
                    : "No Orders Awaiting Confirmation"}
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--admin-muted)" }}>
                  {summary?.pendingOrders
                    ? "Verify address and contact customer before courier dispatch."
                    : "All current orders have been verified and processed."}
                </p>
                {summary?.pendingOrders ? (
                  <Link
                    href="/admin/orders?status=PENDING"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#d97706", marginTop: "8px" }}
                  >
                    <span>Process pending orders</span>
                    <ArrowRight size={12} />
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Action 2: Low Stock */}
            <div
              style={{
                padding: "14px",
                background: summary?.lowStockProducts ? "var(--admin-accent-soft)" : "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <AlertTriangle size={18} color={summary?.lowStockProducts ? "#ef4444" : "#6b7280"} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 800 }}>
                  {summary?.lowStockProducts
                    ? `${summary.lowStockProducts} Figures Low in Stock`
                    : "Stock Quantities Healthy"}
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--admin-muted)" }}>
                  {summary?.lowStockProducts
                    ? "Items are at or below 5 units remaining."
                    : "All active catalogue items have sufficient inventory."}
                </p>
                {summary?.lowStockProducts ? (
                  <Link
                    href="/admin/inventory"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#ef4444", marginTop: "8px" }}
                  >
                    <span>Adjust inventory levels</span>
                    <ArrowRight size={12} />
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Action 3: Quick Catalogue Add */}
            <div
              style={{
                padding: "14px",
                background: "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Package size={18} color="#111111" />
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Add New Anime Figure</span>
              </div>
              <Link href="/admin/products" className="admin-btn admin-btn--primary" style={{ height: "32px", fontSize: "11px" }}>
                + Add Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Recent Orders Overview Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <h3>Recent Store Orders</h3>
            <p>Customer purchases from across Bangladesh awaiting fulfillment or delivery.</p>
          </div>
          <Link href="/admin/orders" className="admin-btn admin-btn--secondary" style={{ height: "34px", fontSize: "11px" }}>
            <span>View All Orders ({summary?.totalOrders || 0})</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--admin-muted)" }}>
            No customer orders received yet.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  const statusClass =
                    order.orderStatus === "DELIVERED"
                      ? "admin-badge--green"
                      : order.orderStatus === "SHIPPED"
                        ? "admin-badge--purple"
                        : order.orderStatus === "CONFIRMED" || order.orderStatus === "PROCESSING"
                          ? "admin-badge--blue"
                          : order.orderStatus === "PENDING"
                            ? "admin-badge--amber"
                            : "admin-badge--red";

                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 800, fontFamily: "var(--font-metadata, monospace)" }}>
                        #{order.orderNumber}
                        <div style={{ fontSize: "11px", color: "var(--admin-muted)", fontWeight: 400 }}>
                          {dateStr}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{order.addressSnapshot?.recipientName || "Collector"}</div>
                        <div style={{ fontSize: "11px", color: "var(--admin-muted)" }}>{order.addressSnapshot?.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.addressSnapshot?.district}</div>
                        <div style={{ fontSize: "11px", color: "var(--admin-muted)" }}>{order.addressSnapshot?.area}</div>
                      </td>
                      <td style={{ fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                        {formatBDT(order.totalAmount)}
                      </td>
                      <td>
                        <span style={{ fontSize: "11px", fontWeight: 700 }}>
                          {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                        </span>
                        <div style={{ fontSize: "10px", color: order.paymentStatus === "PAID" ? "var(--admin-success)" : "var(--admin-warning)" }}>
                          {order.paymentStatus}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${statusClass}`}>{order.orderStatus}</span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/orders?order=${order.orderNumber}`}
                          className="admin-btn admin-btn--secondary"
                          style={{ height: "30px", padding: "0 10px", fontSize: "11px" }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section F: Best-Selling Figures */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <h3>Best-Selling Collectibles</h3>
            <p>Top performing anime figures based on authentic customer orders.</p>
          </div>
        </div>

        {topProducts.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "var(--admin-muted)" }}>
            Order item sales metrics will appear here once orders are confirmed.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Units Sold</th>
                  <th>Total Revenue</th>
                  <th>Stock Remaining</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((prod, idx) => (
                  <tr key={prod.sku || idx}>
                    <td style={{ fontWeight: 700 }}>{prod.productName}</td>
                    <td>
                      <span className="admin-badge admin-badge--gray">
                        {prod.categoryName || "Anime"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-metadata, monospace)", fontSize: "11px", color: "var(--admin-muted)" }}>
                      {prod.sku}
                    </td>
                    <td style={{ fontWeight: 800 }}>{prod.unitsSold} units</td>
                    <td style={{ fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                      {formatBDT(prod.revenue)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: prod.currentStock <= 5 ? "var(--admin-accent)" : "inherit",
                        }}
                      >
                        {prod.currentStock} in stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

