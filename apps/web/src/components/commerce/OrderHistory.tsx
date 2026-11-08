"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
  RefreshCw,
  Ban,
  ArrowRight,
} from "lucide-react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { getOrders, cancelOrder } from "@/lib/commerce-api";
import type { OrderDto } from "@himatu/shared";

export function OrderHistory() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state
  const [cancellingOrder, setCancellingOrder] = useState<OrderDto | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await authService.getSession();
        setSession(s);
        if (s?.accessToken) {
          const list = await getOrders(s.accessToken);
          setOrders(list);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleConfirmCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!cancellingOrder || !session?.accessToken) return;

    setIsSubmittingCancel(true);
    try {
      await cancelOrder(
        session.accessToken,
        cancellingOrder.orderNumber,
        cancelReason || "Customer cancellation request",
      );
      setCancelFeedback(`Order ${cancellingOrder.orderNumber} has been successfully cancelled and inventory released.`);
      setCancellingOrder(null);
      setCancelReason("");

      // Refresh list
      const updated = await getOrders(session.accessToken);
      setOrders(updated);
    } catch (err: any) {
      alert(err.message || "Failed to cancel order");
    } finally {
      setIsSubmittingCancel(false);
    }
  }

  if (loading) {
    return (
      <div className="orders-loading-state">
        <RefreshCw className="animate-spin" size={24} />
        <p>Loading your collectible collection orders...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="empty-state">
        <h2>PLEASE SIGN IN</h2>
        <p>You must be signed in to view your collection orders.</p>
        <Link href="/sign-in?next=/account/orders" className="button">
          SIGN IN
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper">
      {cancelFeedback && (
        <div className="order-cancel-toast">
          <CheckCircle2 size={16} />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-state orders-empty-box">
          <Package size={52} className="orders-empty-icon" />
          <h2>NO COLLECTION ORDERS YET</h2>
          <p>
            You have not placed any collectible figurine orders. Explore our museum-grade anime statues to start your collection.
          </p>
          <div className="orders-empty-actions">
            <Link href="/shop" className="button">
              EXPLORE FIGURES
            </Link>
            <Link href="/account" className="button button-secondary">
              BACK TO PROFILE
            </Link>
          </div>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const isEligibleForCancel =
              order.orderStatus === "PENDING" || order.orderStatus === "CONFIRMED";

            return (
              <article key={order.id} className="order-history-card">
                {/* Header */}
                <div className="order-card-header">
                  <div className="order-meta-left">
                    <span className="order-number-title">{order.orderNumber}</span>
                    <div className="order-date-row">
                      <Calendar size={13} />
                      <span>
                        Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="order-status-group">
                    <span className={`order-status-badge status-${order.orderStatus.toLowerCase()}`}>
                      {order.orderStatus}
                    </span>
                    <span className="payment-method-badge">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="order-items-container">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item-row">
                      <div className="order-item-thumb">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            width={54}
                            height={54}
                            className="order-thumb-img"
                            unoptimized
                          />
                        ) : (
                          <div className="order-thumb-placeholder">
                            <Package size={20} />
                          </div>
                        )}
                      </div>

                      <div className="order-item-info">
                        <h4>{item.productName}</h4>
                        <p className="order-item-sku">SKU: {item.sku}</p>
                      </div>

                      <div className="order-item-quant">
                        <span>Qty: {item.quantity}</span>
                      </div>

                      <div className="order-item-price">
                        <span>৳{item.lineTotal.toLocaleString()}</span>
                        <small>৳{item.unitPrice.toLocaleString()} each</small>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Snapshot & Totals */}
                <div className="order-card-footer">
                  <div className="order-delivery-snapshot">
                    <div className="snapshot-title">
                      <MapPin size={14} />
                      <span>Delivery Address</span>
                    </div>
                    <p className="snapshot-address">
                      <strong>{order.addressSnapshot.recipientName}</strong> ({order.addressSnapshot.phone})
                      <br />
                      {order.addressSnapshot.fullAddress}, {order.addressSnapshot.area},{" "}
                      {order.addressSnapshot.district}
                    </p>
                    {order.customerNotes && (
                      <p className="snapshot-notes">Notes: &ldquo;{order.customerNotes}&rdquo;</p>
                    )}
                  </div>

                  <div className="order-financials">
                    <div className="fin-row">
                      <span>Subtotal</span>
                      <span>৳{order.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="fin-row">
                      <span>Courier Shipping</span>
                      <span>{order.shippingCharge === 0 ? "FREE" : `৳${order.shippingCharge}`}</span>
                    </div>
                    <div className="fin-row total-row">
                      <span>Total Amount</span>
                      <span>৳{order.totalAmount.toLocaleString()} BDT</span>
                    </div>

                    {isEligibleForCancel && (
                      <button
                        onClick={() => setCancellingOrder(order)}
                        className="button-cancel-order"
                      >
                        <Ban size={13} />
                        <span>Cancel Order</span>
                      </button>
                    )}

                    {order.orderStatus === "CANCELLED" && (
                      <p className="cancelled-note">
                        Order cancelled on {new Date(order.cancelledAt || order.updatedAt).toLocaleDateString()}. Stock released.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancellingOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card modal-sm">
            <div className="modal-header">
              <h2>CANCEL ORDER</h2>
              <button onClick={() => setCancellingOrder(null)} className="modal-close-btn">
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmCancel} className="admin-form">
              <p className="modal-subtitle">
                Are you sure you want to cancel order <strong>{cancellingOrder.orderNumber}</strong>?
                Reserved collectible stock will be immediately released back to the vault.
              </p>

              <div className="field">
                <label>Reason for cancellation *</label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Changed my mind, ordered duplicate, need to change delivery address..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="button button-secondary"
                  disabled={isSubmittingCancel}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  className="button button-danger"
                  disabled={isSubmittingCancel}
                >
                  {isSubmittingCancel ? "Cancelling..." : "CONFIRM CANCELLATION"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

