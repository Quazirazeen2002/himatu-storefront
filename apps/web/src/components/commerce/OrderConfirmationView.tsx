"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { getOrderByNumber } from "@/lib/commerce-api";
import type { OrderDto } from "@himatu/shared";

export function OrderConfirmationView() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      try {
        const session = await authService.getSession();
        if (session?.accessToken) {
          const ord = await getOrderByNumber(session.accessToken, orderNumber);
          setOrder(ord);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order receipt");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="orders-loading-state">
        <RefreshCw className="animate-spin" size={28} />
        <p>Loading confirmed collectible order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-card">
        <CheckCircle2 size={56} className="text-accent" />
        <h2>ORDER RECEIVED & CONFIRMED</h2>
        <p>
          Thank you for choosing HIMATU for your authentic anime collectibles collection.
        </p>
        <div className="confirmation-actions">
          <Link href="/account/orders" className="button">
            VIEW ORDER HISTORY
          </Link>
          <Link href="/shop" className="button button-secondary">
            CONTINUE EXPLORING
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-receipt-wrapper">
      {/* Banner */}
      <div className="confirmation-hero-banner">
        <div className="confirm-icon-wrap">
          <CheckCircle2 size={42} className="confirm-check" />
        </div>
        <div className="confirm-hero-text">
          <p className="eyebrow">ORDER CONFIRMED · THANK YOU FOR YOUR PURCHASE</p>
          <h2>{order.orderNumber}</h2>
          <p>
            Your collectible order has been securely registered in the HIMATU database. Our packaging team is preparing your corner-protected insured courier parcel.
          </p>
        </div>
      </div>

      {/* Grid: Order Items & Delivery Breakdown */}
      <div className="confirmation-grid">
        {/* Left: Items list */}
        <div className="confirmation-items-card">
          <h3>ORDERED COLLECTIBLES ({order.items.length})</h3>

          <div className="confirmation-items-list">
            {order.items.map((item) => (
              <div key={item.id} className="confirm-item-row">
                <div className="confirm-item-thumb">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      width={64}
                      height={64}
                      className="confirm-thumb-img"
                      unoptimized
                    />
                  ) : (
                    <div className="confirm-thumb-placeholder">
                      <Package size={24} />
                    </div>
                  )}
                </div>

                <div className="confirm-item-meta">
                  <h4>{item.productName}</h4>
                  <p className="confirm-item-sku">SKU: {item.sku}</p>
                  <p className="confirm-item-qty">Quantity: {item.quantity}</p>
                </div>

                <div className="confirm-item-price">
                  <span>৳{item.lineTotal.toLocaleString()}</span>
                  <small>৳{item.unitPrice.toLocaleString()} each</small>
                </div>
              </div>
            ))}
          </div>

          <div className="confirm-totals-box">
            <div className="confirm-total-row">
              <span>Subtotal</span>
              <span>৳{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="confirm-total-row">
              <span>Nationwide Courier Charge</span>
              <span>{order.shippingCharge === 0 ? "FREE" : `৳${order.shippingCharge}`}</span>
            </div>
            <div className="confirm-total-row total-highlight">
              <span>Total Payable</span>
              <span>৳{order.totalAmount.toLocaleString()} BDT</span>
            </div>
          </div>
        </div>

        {/* Right: Delivery & Payment Details */}
        <div className="confirmation-sidebar">
          <div className="confirm-sidebar-card">
            <h3>DELIVERY DETAILS</h3>
            <div className="confirm-info-block">
              <div className="confirm-info-header">
                <MapPin size={15} />
                <span>Shipping Address</span>
              </div>
              <p>
                <strong>{order.addressSnapshot.recipientName}</strong>
                <br />
                {order.addressSnapshot.phone}
                <br />
                {order.addressSnapshot.fullAddress}
                <br />
                {order.addressSnapshot.area}, {order.addressSnapshot.district}
              </p>
            </div>

            <div className="confirm-info-block">
              <div className="confirm-info-header">
                <Truck size={15} />
                <span>Courier Service</span>
              </div>
              <p>
                Insured Express Courier with double-walled corner guards. Delivery estimate:{" "}
                <strong>
                  {order.addressSnapshot.district.toLowerCase() === "dhaka"
                    ? "1–2 Business Days"
                    : "2–4 Business Days"}
                </strong>
              </p>
            </div>

            <div className="confirm-info-block">
              <div className="confirm-info-header">
                <CreditCard size={15} />
                <span>Payment Method</span>
              </div>
              <p>
                <strong>Cash on Delivery (COD)</strong>
                <br />
                Payment status: <strong>{order.paymentStatus}</strong> (Payable upon parcel inspection).
              </p>
            </div>

            <div className="confirm-actions-stack">
              <Link href="/account/orders" className="button">
                VIEW IN MY ORDERS
              </Link>
              <Link href="/shop" className="button button-secondary">
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

