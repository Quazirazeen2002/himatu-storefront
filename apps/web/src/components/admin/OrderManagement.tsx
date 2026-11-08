"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  Eye,
  RefreshCw,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import { getAdminOrders, updateAdminOrderStatus } from "@/lib/commerce-api";
import type { OrderDto, OrderStatus } from "@himatu/shared";

const ORDER_STATUS_TABS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export function OrderManagement() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [activeOrder, setActiveOrder] = useState<OrderDto | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const searchParams = useSearchParams();

  const loadOrders = async (token: string, p = page, st = statusFilter, s = search) => {
    try {
      const data = await getAdminOrders(token, {
        page: p,
        limit: 15,
        status: st,
        search: s.trim() || undefined,
      });
      setOrders(Array.isArray(data?.items) ? data.items : []);
      setTotalCount(data?.total || 0);
      setTotalPages(data?.totalPages || 1);

      // Check if URL query specified an order to view
      const targetOrderNumber = searchParams.get("order");
      if (targetOrderNumber && !activeOrder && Array.isArray(data?.items)) {
        const found = data.items.find((o) => o.orderNumber === targetOrderNumber);
        if (found) setActiveOrder(found);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      if (s?.accessToken && s.user.role === "ADMIN") {
        loadOrders(s.accessToken).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleTabChange = (st: string) => {
    setStatusFilter(st);
    setPage(1);
    if (session?.accessToken) {
      loadOrders(session.accessToken, 1, st, search);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    if (session?.accessToken) {
      loadOrders(session.accessToken, 1, statusFilter, search);
    }
  };

  const handleStatusTransition = async (newStatus: OrderStatus, reason?: string) => {
    if (!activeOrder || !session?.accessToken) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateAdminOrderStatus(
        session.accessToken,
        activeOrder.id,
        newStatus,
        reason,
      );
      setActiveOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setCancelModalOpen(false);
      setCancelReason("");
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatBDT = (amount: number) =>
    `৳${new Intl.NumberFormat("en-BD").format(amount)}`;

  if (loading) {
    return <p style={{ padding: "40px", fontWeight: 700 }}>LOADING ORDERS WORKSPACE…</p>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Order Management & Fulfillment</h1>
          <p>Review customer orders, verify delivery addresses, and coordinate courier dispatches.</p>
        </div>
      </div>

      {/* Toolbar with Search and Status Tabs */}
      <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {ORDER_STATUS_TABS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleTabChange(st)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  border: 0,
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  background: statusFilter === st ? "#111111" : "#f3f4f6",
                  color: statusFilter === st ? "#ffffff" : "var(--admin-muted)",
                  transition: "all 0.15s ease",
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
            <div style={{ position: "relative", width: "260px" }}>
              <input
                type="search"
                placeholder="Search order #, customer, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 12px",
                  borderRadius: "4px",
                  border: "1px solid var(--admin-border)",
                  fontSize: "12px",
                }}
              />
            </div>
            <button type="submit" className="admin-btn admin-btn--secondary" style={{ height: "36px", fontSize: "11px" }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-card">
        {orders.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-muted)" }}>
            No orders found matching the selected filter.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Delivery Location</th>
                  <th>Figures</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
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
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{dateStr}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{order.addressSnapshot?.recipientName || "Collector"}</div>
                        <div style={{ fontSize: "11px", color: "var(--admin-muted)" }}>{order.addressSnapshot?.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.addressSnapshot?.district}</div>
                        <div style={{ fontSize: "11px", color: "var(--admin-muted)" }}>{order.addressSnapshot?.area}</div>
                      </td>
                      <td style={{ fontSize: "12px" }}>
                        <strong>{order.items?.length || 0}</strong> item{order.items?.length === 1 ? "" : "s"}
                      </td>
                      <td style={{ fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                        {formatBDT(order.totalAmount)}
                      </td>
                      <td>
                        <div style={{ fontSize: "11px", fontWeight: 700 }}>
                          {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: order.paymentStatus === "PAID" ? "var(--admin-success)" : "var(--admin-warning)",
                          }}
                        >
                          {order.paymentStatus}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${statusClass}`}>{order.orderStatus}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          style={{ height: "30px", padding: "0 10px", fontSize: "11px" }}
                          onClick={() => setActiveOrder(order)}
                        >
                          <Eye size={12} />
                          <span>View Order</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
            <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
              Page {page} of {totalPages} ({totalCount} total orders)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={page <= 1}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  if (session?.accessToken) loadOrders(session.accessToken, p);
                }}
                style={{ height: "32px", fontSize: "11px" }}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                disabled={page >= totalPages}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  if (session?.accessToken) loadOrders(session.accessToken, p);
                }}
                style={{ height: "32px", fontSize: "11px" }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Drawer / Modal */}
      {activeOrder && (
        <div className="admin-modal-backdrop" onClick={() => setActiveOrder(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "760px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 style={{ fontFamily: "var(--font-metadata, monospace)" }}>
                  Order #{activeOrder.orderNumber}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
                  Placed on {new Date(activeOrder.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" })} (BST)
                </span>
              </div>
              <button type="button" onClick={() => setActiveOrder(null)} style={{ background: "transparent", border: 0, cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Status and Action Buttons Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  background: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px solid var(--admin-border)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--admin-muted)", display: "block" }}>
                    Current Order Status
                  </span>
                  <span className={`admin-badge ${activeOrder.orderStatus === "DELIVERED" ? "admin-badge--green" : activeOrder.orderStatus === "SHIPPED" ? "admin-badge--purple" : activeOrder.orderStatus === "CANCELLED" ? "admin-badge--red" : "admin-badge--amber"}`} style={{ marginTop: "4px" }}>
                    {activeOrder.orderStatus}
                  </span>
                </div>

                {/* Contextual Action Transitions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {activeOrder.orderStatus === "PENDING" && (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary"
                        disabled={updatingStatus}
                        onClick={() => handleStatusTransition("CONFIRMED")}
                      >
                        <CheckCircle2 size={14} />
                        <span>Confirm Order</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        disabled={updatingStatus}
                        onClick={() => setCancelModalOpen(true)}
                      >
                        <XCircle size={14} />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}

                  {activeOrder.orderStatus === "CONFIRMED" && (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary"
                        disabled={updatingStatus}
                        onClick={() => handleStatusTransition("PROCESSING")}
                      >
                        <Package size={14} />
                        <span>Mark as Processing</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        disabled={updatingStatus}
                        onClick={() => setCancelModalOpen(true)}
                      >
                        <XCircle size={14} />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}

                  {activeOrder.orderStatus === "PROCESSING" && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={updatingStatus}
                      onClick={() => handleStatusTransition("SHIPPED")}
                    >
                      <Truck size={14} />
                      <span>Dispatch & Mark as Shipped</span>
                    </button>
                  )}

                  {activeOrder.orderStatus === "SHIPPED" && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      style={{ background: "#10b981", borderColor: "#10b981" }}
                      disabled={updatingStatus}
                      onClick={() => handleStatusTransition("DELIVERED")}
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Delivered & Confirm Cash Collected</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Customer & Shipping Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ padding: "16px", background: "var(--admin-bg)", borderRadius: "6px", border: "1px solid var(--admin-border)" }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--admin-muted)" }}>
                    Recipient & Delivery
                  </h4>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{activeOrder.addressSnapshot?.recipientName}</div>
                  <div style={{ fontSize: "12px", color: "var(--admin-muted)", marginTop: "4px" }}>
                    {activeOrder.addressSnapshot?.fullAddress}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginTop: "2px" }}>
                    {activeOrder.addressSnapshot?.area}, {activeOrder.addressSnapshot?.district}
                    {activeOrder.addressSnapshot?.postalCode ? ` - ${activeOrder.addressSnapshot.postalCode}` : ""}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--admin-text)", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Phone size={13} />
                    <span>{activeOrder.addressSnapshot?.phone}</span>
                  </div>
                </div>

                <div style={{ padding: "16px", background: "var(--admin-bg)", borderRadius: "6px", border: "1px solid var(--admin-border)" }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--admin-muted)" }}>
                    Payment Information
                  </h4>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>
                    Method: {activeOrder.paymentMethod === "COD" ? "Cash on Delivery (Courier Collection)" : activeOrder.paymentMethod}
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "4px", color: activeOrder.paymentStatus === "PAID" ? "var(--admin-success)" : "#d97706", fontWeight: 700 }}>
                    Status: {activeOrder.paymentStatus}
                  </div>
                  {activeOrder.customerNotes && (
                    <div style={{ fontSize: "11px", color: "var(--admin-muted)", marginTop: "8px", background: "#ffffff", padding: "6px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}>
                      <strong>Customer Notes:</strong> {activeOrder.customerNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 style={{ margin: "14px 0 8px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--admin-muted)" }}>
                  Ordered Collectibles ({activeOrder.items?.length || 0})
                </h4>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Figure</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700 }}>{item.productName}</td>
                          <td style={{ fontFamily: "var(--font-metadata, monospace)", fontSize: "11px", color: "var(--admin-muted)" }}>
                            {item.sku}
                          </td>
                          <td>{formatBDT(item.unitPrice)}</td>
                          <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                          <td style={{ textAlign: "right", fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                            {formatBDT(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div style={{ padding: "16px", background: "#f9fafb", borderRadius: "6px", border: "1px solid var(--admin-border)", marginLeft: "auto", maxWidth: "300px", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span>Subtotal:</span>
                  <span>{formatBDT(activeOrder.subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span>Courier Shipping:</span>
                  <span>{formatBDT(activeOrder.shippingCharge)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 800, borderTop: "1px solid var(--admin-border)", paddingTop: "8px" }}>
                  <span>Total Due:</span>
                  <span>{formatBDT(activeOrder.totalAmount)}</span>
                </div>
              </div>

              {activeOrder.cancelReason && (
                <div style={{ padding: "12px", background: "var(--admin-accent-soft)", borderRadius: "6px", border: "1px solid var(--admin-accent)", color: "#ef4444", fontSize: "12px" }}>
                  <strong>Order Cancelled:</strong> {activeOrder.cancelReason}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setActiveOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setCancelModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Confirm Order Cancellation</h3>
              <button type="button" onClick={() => setCancelModalOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: "13px", color: "var(--admin-muted)", margin: 0 }}>
                Cancelling this order will automatically release reserved quantities back into inventory stock.
              </p>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, margin: "10px 0 6px" }}>
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer requested, Unable to verify phone number, Out of stock"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setCancelModalOpen(false)}>
                Go Back
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={!cancelReason.trim() || updatingStatus}
                onClick={() => handleStatusTransition("CANCELLED", cancelReason)}
              >
                Confirm Cancellation & Release Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

