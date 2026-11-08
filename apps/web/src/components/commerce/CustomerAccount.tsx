"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Package,
  Heart,
  ShieldCheck,
  LogOut,
  Plus,
  Check,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Printer,
} from "lucide-react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import {
  getAddresses,
  createAddress,
  deleteAddress,
  setDefaultAddress,
  getOrders,
} from "@/lib/commerce-api";
import type { AddressDto, OrderDto } from "@himatu/shared";
import { useStore } from "./StoreProvider";

function getInitials(name: string, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "H";
}

const BD_DISTRICTS = [
  "Dhaka",
  "Chittagong",
  "Sylhet",
  "Gazipur",
  "Narayanganj",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Comilla",
  "Brahmanbaria",
  "Cox's Bazar",
  "Bogura",
  "Jessore",
  "Dinajpur",
  "Tangail",
];

export function CustomerAccount() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "addresses" | "orders" | "wishlist" | "security"
  >("profile");

  // Profile Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Address State
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDistrict, setNewDistrict] = useState("Dhaka");
  const [newArea, setNewArea] = useState("");
  const [newFullAddress, setNewFullAddress] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<OrderDto[]>([]);

  // Sign out state
  const [signingOut, setSigningOut] = useState(false);

  const router = useRouter();
  const store = useStore();

  const loadData = async (token?: string) => {
    if (!token) return;
    try {
      const [addrList, orderList] = await Promise.allSettled([
        getAddresses(token),
        getOrders(token),
      ]);
      if (addrList.status === "fulfilled") setAddresses(addrList.value);
      if (orderList.status === "fulfilled") setOrders(orderList.value);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    let active = true;
    authService
      .getSession()
      .then(async (s) => {
        if (!active) return;
        setSession(s);
        if (s?.user) {
          setName(s.user.fullName || "");
          setPhone(s.user.phone || "");
        }
        if (s?.accessToken) {
          await loadData(s.accessToken);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      const result = await authService.updateProfile({
        fullName: name,
        phone: phone || null,
      });
      if (result.ok) {
        setProfileFeedback({
          type: "success",
          text: "Collector profile saved successfully.",
        });
      } else {
        setProfileFeedback({
          type: "error",
          text: result.message || "Failed to update profile.",
        });
        if (result.code === "signed_out") router.push("/sign-in");
      }
    } catch {
      setProfileFeedback({
        type: "error",
        text: "Could not save profile changes.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;
    setAddressSaving(true);
    setAddressError(null);

    try {
      const created = await createAddress(session.accessToken, {
        recipientName: newRecipient,
        phone: newPhone,
        district: newDistrict,
        area: newArea,
        fullAddress: newFullAddress,
        postalCode: newPostalCode || undefined,
        isDefault: newIsDefault,
      });

      setAddresses((prev) =>
        newIsDefault
          ? [created, ...prev.map((a) => ({ ...a, isDefault: false }))]
          : [...prev, created],
      );

      // Reset form
      setNewRecipient("");
      setNewPhone("");
      setNewDistrict("Dhaka");
      setNewArea("");
      setNewFullAddress("");
      setNewPostalCode("");
      setNewIsDefault(false);
      setShowAddAddress(false);
    } catch (err: any) {
      setAddressError(err.message || "Failed to save address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!session?.accessToken) return;
    if (!confirm("Are you sure you want to remove this delivery address?")) return;
    try {
      await deleteAddress(session.accessToken, id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete address.");
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!session?.accessToken) return;
    try {
      await setDefaultAddress(session.accessToken, id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id })),
      );
    } catch (err: any) {
      alert(err.message || "Failed to set default address.");
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authService.signOut();
      router.push("/sign-in");
      router.refresh();
    } catch {
      router.push("/sign-in");
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="account-empty-state">
        <p>Loading your collector account…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="account-card" style={{ maxWidth: "540px", margin: "40px auto" }}>
        <div className="account-empty-state">
          <ShieldAlert size={36} color="var(--accent)" />
          <h4>SIGN IN REQUIRED</h4>
          <p>Sign in to access your collector profile, verified shipping addresses, and orders.</p>
          <Link href="/sign-in?next=/account" className="button" style={{ marginTop: "12px" }}>
            SIGN IN TO HIMATU
          </Link>
        </div>
      </div>
    );
  }

  const initials = getInitials(session.user.fullName, session.user.email);
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];

  return (
    <div className="account-portal">
      {/* 1. Collector Header Profile Hero */}
      <div className="account-hero">
        <div className="account-hero-profile">
          <span className="account-hero-avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="account-hero-meta">
            <h2 className="account-hero-name">
              {session.user.fullName || "Collector"}
            </h2>
            <p className="account-hero-email">{session.user.email}</p>
            <span
              className={`account-badge-role ${
                session.user.role === "ADMIN" ? "is-admin" : "is-customer"
              }`}
            >
              {session.user.role === "ADMIN" ? (
                <>
                  <ShieldCheck size={13} />
                  <span>ADMINISTRATOR · PRIVILEGED</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>VERIFIED MEMBER</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="account-hero-right">
          <div className="account-hero-stats">
            <div className="account-hero-stat">
              <span className="account-hero-stat-value">{orders.length}</span>
              <span className="account-hero-stat-label">Orders</span>
            </div>
            <div className="account-hero-stat">
              <span className="account-hero-stat-value">{store.wishlist.length}</span>
              <span className="account-hero-stat-label">Wishlist</span>
            </div>
            <div className="account-hero-stat">
              <span className="account-hero-stat-value">
                {defaultAddr ? defaultAddr.district : "None"}
              </span>
              <span className="account-hero-stat-label">Delivery</span>
            </div>
          </div>

          <button
            type="button"
            className="account-signout-btn"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut size={14} />
            <span>{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>

      {/* 2. Admin Privileges Callout Banner */}
      {session.user.role === "ADMIN" && (
        <div className="account-admin-banner">
          <div className="account-admin-info">
            <ShieldCheck size={24} />
            <div className="account-admin-text">
              <strong>ADMINISTRATOR CONTROLS ENABLED</strong>
              <small>Manage catalogue figures, inventory stock, and Supabase image uploads.</small>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/admin" className="account-admin-link">
              <span>Admin Dashboard</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/admin/products"
              className="account-admin-link"
              style={{ background: "transparent", border: "1px solid var(--border)" }}
            >
              <span>Product Management</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* 3. High-End Tabbed Navigation */}
      <nav className="account-tabs-bar" aria-label="Account sections">
        <button
          type="button"
          className={`account-tab-btn ${activeTab === "profile" ? "is-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User size={15} />
          <span>Profile & Contact</span>
        </button>

        <button
          type="button"
          className={`account-tab-btn ${activeTab === "addresses" ? "is-active" : ""}`}
          onClick={() => setActiveTab("addresses")}
        >
          <MapPin size={15} />
          <span>Shipping Addresses</span>
          {addresses.length > 0 && (
            <span className="account-tab-count">{addresses.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`account-tab-btn ${activeTab === "orders" ? "is-active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <Package size={15} />
          <span>Recent Orders</span>
          {orders.length > 0 && (
            <span className="account-tab-count">{orders.length}</span>
          )}
        </button>

        <Link
          href="/account/printing-requests"
          className="account-tab-btn"
          style={{ textDecoration: "none" }}
        >
          <Printer size={15} />
          <span>3D Print Commissions</span>
        </Link>

        <button
          type="button"
          className={`account-tab-btn ${activeTab === "wishlist" ? "is-active" : ""}`}
          onClick={() => setActiveTab("wishlist")}
        >
          <Heart size={15} />
          <span>Wishlist</span>
          {store.wishlist.length > 0 && (
            <span className="account-tab-count">{store.wishlist.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`account-tab-btn ${activeTab === "security" ? "is-active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <ShieldCheck size={15} />
          <span>Security</span>
        </button>
      </nav>

      {/* 4. Tab Panels */}

      {/* TAB 1: Profile & Contact */}
      {activeTab === "profile" && (
        <section className="account-card" aria-label="Profile and personal details">
          <div className="account-card-header">
            <div className="account-card-title">
              <h3>Collector Details</h3>
              <p>Your primary name and telephone number for deliveries and receipts.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="account-profile-form">
            <div className="account-field">
              <label htmlFor="account-fullname">Full Name</label>
              <div className="account-input-wrap">
                <input
                  id="account-fullname"
                  type="text"
                  required
                  maxLength={120}
                  className="account-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={profileSaving}
                />
              </div>
            </div>

            <div className="account-field">
              <label htmlFor="account-email">Email Address</label>
              <div className="account-input-wrap">
                <input
                  id="account-email"
                  type="email"
                  disabled
                  className="account-input"
                  value={session.user.email}
                />
                <Mail size={16} className="account-input-icon" />
              </div>
            </div>

            <div className="account-field">
              <label htmlFor="account-phone">Mobile Phone (Bangladesh)</label>
              <div className="account-input-wrap">
                <input
                  id="account-phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  pattern="(?:\+880|0)1[3-9][0-9]{8}"
                  className="account-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={profileSaving}
                />
                <Phone size={16} className="account-input-icon" />
              </div>
            </div>

            <div className="account-field">
              <label>Account Role</label>
              <div className="account-input-wrap">
                <input
                  type="text"
                  disabled
                  className="account-input"
                  value={session.user.role === "ADMIN" ? "Administrator" : "Customer / Collector"}
                />
              </div>
            </div>

            <div className="account-form-actions">
              <button
                type="submit"
                className="account-btn-save"
                disabled={profileSaving}
              >
                {profileSaving ? "Saving changes…" : "Save Profile Changes"}
              </button>

              {profileFeedback && (
                <span
                  role="status"
                  className={`account-status-msg ${profileFeedback.type}`}
                >
                  {profileFeedback.text}
                </span>
              )}
            </div>
          </form>
        </section>
      )}

      {/* TAB 2: Shipping Addresses */}
      {activeTab === "addresses" && (
        <section className="account-card" aria-label="Shipping addresses">
          <div className="account-card-header">
            <div className="account-card-title">
              <h3>Saved Shipping Addresses</h3>
              <p>Addresses used for nationwide courier delivery and Cash on Delivery in Bangladesh.</p>
            </div>
            <button
              type="button"
              className="button button--outline"
              style={{ padding: "8px 16px", fontSize: "11px" }}
              onClick={() => setShowAddAddress((prev) => !prev)}
            >
              <Plus size={14} />
              <span>{showAddAddress ? "Cancel" : "Add New Address"}</span>
            </button>
          </div>

          {/* Add Address Form Accordion */}
          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="account-address-form">
              <div className="account-field">
                <label>Recipient Name</label>
                <input
                  type="text"
                  required
                  placeholder="Recipient full name"
                  className="account-input"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                />
              </div>

              <div className="account-field">
                <label>Mobile Phone (Bangladesh)</label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  className="account-input"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div className="account-field">
                <label>District</label>
                <select
                  className="account-input"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                >
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="account-field">
                <label>Area / Thana / Sub-district</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanmondi, Gulshan, Uttara"
                  className="account-input"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                />
              </div>

              <div className="account-field account-form-full">
                <label>Full Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="House number, road number, flat/apartment, landmarks"
                  className="account-input"
                  value={newFullAddress}
                  onChange={(e) => setNewFullAddress(e.target.value)}
                />
              </div>

              <div className="account-field">
                <label>Postal Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1205"
                  className="account-input"
                  value={newPostalCode}
                  onChange={(e) => setNewPostalCode(e.target.value)}
                />
              </div>

              <label className="account-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                />
                <span>Set as primary shipping address</span>
              </label>

              {addressError && (
                <div className="account-form-full">
                  <p className="account-status-msg error">{addressError}</p>
                </div>
              )}

              <div className="account-form-actions">
                <button
                  type="submit"
                  className="account-btn-save"
                  disabled={addressSaving}
                >
                  {addressSaving ? "Saving…" : "Save Address"}
                </button>
              </div>
            </form>
          )}

          {/* Existing Addresses Grid */}
          {addresses.length === 0 && !showAddAddress ? (
            <div className="account-empty-state">
              <MapPin size={32} />
              <h4>NO SAVED ADDRESSES YET</h4>
              <p>Add your primary delivery address for 1-click checkout and faster order processing.</p>
              <button
                type="button"
                className="button"
                onClick={() => setShowAddAddress(true)}
                style={{ marginTop: "10px" }}
              >
                + ADD DELIVERY ADDRESS
              </button>
            </div>
          ) : (
            <div className="account-addresses-grid">
              {addresses.map((addr) => (
                <article
                  key={addr.id}
                  className={`account-address-card ${addr.isDefault ? "is-default" : ""}`}
                >
                  <div>
                    {addr.isDefault && (
                      <span className="account-address-badge-default">
                        PRIMARY SHIPPING
                      </span>
                    )}
                    <h4 className="account-address-name">{addr.recipientName}</h4>
                    <p className="account-address-text">
                      {addr.fullAddress}, {addr.area}, {addr.district}
                      {addr.postalCode ? ` - ${addr.postalCode}` : ""}
                    </p>
                    <span className="account-address-phone">
                      <Phone size={13} />
                      <span>{addr.phone}</span>
                    </span>
                  </div>

                  <div className="account-address-actions">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        className="account-address-btn-def"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                      >
                        Make default
                      </button>
                    )}
                    <button
                      type="button"
                      className="account-address-btn-del"
                      title="Delete address"
                      onClick={() => handleDeleteAddress(addr.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Recent Orders Snapshot */}
      {activeTab === "orders" && (
        <section className="account-card" aria-label="Recent collection orders">
          <div className="account-card-header">
            <div className="account-card-title">
              <h3>Recent Collection Orders</h3>
              <p>Track delivery dispatches, inspect genuine figurine receipts, and view courier status.</p>
            </div>
            <Link
              href="/account/orders"
              className="button button--outline"
              style={{ padding: "8px 16px", fontSize: "11px" }}
            >
              <span>View All Orders</span>
              <ExternalLink size={13} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="account-empty-state">
              <Package size={32} />
              <h4>NO ORDERS PLACED YET</h4>
              <p>Your authentic scale figurine orders and nationwide shipments will appear here.</p>
              <Link href="/shop" className="button" style={{ marginTop: "12px" }}>
                EXPLORE CATALOGUE
              </Link>
            </div>
          ) : (
            <div className="account-orders-list">
              {orders.slice(0, 3).map((order) => {
                const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <article key={order.id} className="account-order-item">
                    <div className="account-order-topline">
                      <div>
                        <span className="account-order-num">#{order.orderNumber}</span>
                        <span className="account-order-date">{dateStr}</span>
                      </div>
                      <span className={`order-status-pill status-${order.orderStatus.toLowerCase()}`}>
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="account-order-goods">
                      {order.items?.slice(0, 3).map((item) => (
                        <div key={item.id} className="account-order-goods-info">
                          <span className="account-order-goods-name">
                            {item.productName}
                          </span>
                          <span className="account-order-goods-sub">
                            Qty: {item.quantity} · ৳{new Intl.NumberFormat("en-BD").format(item.unitPrice)}
                          </span>
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                          +{order.items.length - 3} more items
                        </span>
                      )}
                    </div>

                    <div className="account-order-bottomline">
                      <span className="account-order-total-lbl">
                        Payment: {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                      </span>
                      <span className="account-order-total-val">
                        Total: ৳{new Intl.NumberFormat("en-BD").format(order.totalAmount)}
                      </span>
                    </div>
                  </article>
                );
              })}

              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <Link
                  href="/account/orders"
                  className="button button--outline"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>MANAGE ALL ORDERS & DISPATCHES →</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: Saved Wishlist */}
      {activeTab === "wishlist" && (
        <section className="account-card" aria-label="Saved wishlist">
          <div className="account-card-header">
            <div className="account-card-title">
              <h3>Saved Figures & Wishlist</h3>
              <p>Keep your favourite anime figures and high-priority collectibles saved for later.</p>
            </div>
          </div>

          <div className="account-empty-state">
            <Heart size={36} color="var(--accent)" />
            <h4>
              {store.wishlist.length > 0
                ? `${store.wishlist.length} FIGURE${store.wishlist.length === 1 ? "" : "S"} SAVED`
                : "YOUR WISHLIST IS CURRENTLY EMPTY"}
            </h4>
            <p>
              {store.wishlist.length > 0
                ? "Tap below to view, compare, and transfer your saved figures to your shopping bag."
                : "Explore our collection and click the heart icon on any figure to save it here."}
            </p>
            <Link
              href={store.wishlist.length > 0 ? "/wishlist" : "/shop"}
              className="button"
              style={{ marginTop: "12px" }}
            >
              {store.wishlist.length > 0 ? "VIEW WISHLIST" : "BROWSE FIGURE CATALOGUE"}
            </Link>
          </div>
        </section>
      )}

      {/* TAB 5: Security */}
      {activeTab === "security" && (
        <section className="account-card" aria-label="Security and credentials">
          <div className="account-card-header">
            <div className="account-card-title">
              <h3>Security & Credentials</h3>
              <p>Manage your password, account verification, and session authentication.</p>
            </div>
          </div>

          <div className="account-security-grid">
            <div className="account-sec-card">
              <h4>Email Verification</h4>
              <p>
                Your account email (<strong>{session.user.email}</strong>) is verified and secured by Supabase Auth with HTTP-only cookies.
              </p>
              <div style={{ marginTop: "auto", paddingTop: "10px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#10b981",
                  }}
                >
                  <Check size={14} />
                  <span>VERIFIED & PROTECTED</span>
                </span>
              </div>
            </div>

            <div className="account-sec-card">
              <h4>Password & Recovery</h4>
              <p>
                You can change your password anytime or request a 6-digit OTP verification recovery code to your registered email.
              </p>
              <div style={{ marginTop: "auto", paddingTop: "10px" }}>
                <Link
                  href="/update-password"
                  className="button button--outline"
                  style={{ padding: "8px 16px", fontSize: "11px" }}
                >
                  <span>UPDATE PASSWORD</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
