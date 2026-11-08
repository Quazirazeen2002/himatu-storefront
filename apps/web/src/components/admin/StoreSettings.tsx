"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Store,
  Truck,
  AlertTriangle,
  Save,
  Check,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Lock,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import { getAdminSettings, updateAdminSettings } from "@/lib/commerce-api";
import type { StoreSettingsDto } from "@himatu/shared";

export function StoreSettings() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Admin credentials state
  const [adminFullName, setAdminFullName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [formData, setFormData] = useState<StoreSettingsDto>({
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

  useEffect(() => {
    authService.getSession().then(async (s) => {
      setSession(s);
      if (s?.user) {
        setAdminFullName(s.user.fullName || "");
        setAdminPhone(s.user.phone || "");
      }
      if (s?.accessToken && s.user.role === "ADMIN") {
        try {
          const settings = await getAdminSettings(s.accessToken);
          setFormData(settings);
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordFeedback({ ok: false, msg: "Password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ ok: false, msg: "New passwords do not match." });
      return;
    }
    setPasswordUpdating(true);
    setPasswordFeedback(null);
    try {
      const res = await authService.updatePassword(newPassword);
      if (res.ok) {
        setPasswordFeedback({ ok: true, msg: "Admin password updated successfully." });
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordFeedback(null), 4000);
      } else {
        setPasswordFeedback({ ok: false, msg: res.message || "Failed to update password." });
      }
    } catch (err: any) {
      setPasswordFeedback({ ok: false, msg: err.message || "Failed to update password." });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileUpdating(true);
    setProfileFeedback(null);
    try {
      const res = await authService.updateProfile({ fullName: adminFullName, phone: adminPhone });
      if (res.ok) {
        setProfileFeedback({ ok: true, msg: "Admin profile updated successfully." });
        setTimeout(() => setProfileFeedback(null), 4000);
      } else {
        setProfileFeedback({ ok: false, msg: res.message || "Failed to update profile." });
      }
    } catch (err: any) {
      setProfileFeedback({ ok: false, msg: err.message || "Failed to update profile." });
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await updateAdminSettings(session.accessToken, formData);
      setFormData(updated);
      setFeedback("Store configuration saved successfully.");
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to update store settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ padding: "40px", fontWeight: 700 }}>LOADING STORE SETTINGS…</p>;
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      <form onSubmit={handleSubmit}>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Store Settings & Configuration</h1>
          <p>Configure business contact details, shipping delivery rates in Bangladesh, and operational alerts.</p>
        </div>
        <div className="admin-page-actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            <Save size={14} />
            <span>{saving ? "Saving…" : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ padding: "12px 18px", background: "var(--admin-success-soft)", border: "1px solid var(--admin-success)", color: "var(--admin-success)", borderRadius: "6px", marginBottom: "20px", fontWeight: 700, fontSize: "13px" }}>
          {feedback}
        </div>
      )}

      {/* Store Information */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <h3>Store Brand & Contact Information</h3>
            <p>Official store details displayed on customer receipts and courier labels.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Store Name
            </label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Concierge Contact Email
            </label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Customer Support Phone
            </label>
            <input
              type="text"
              required
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Business Operating Address (Dhaka, Bangladesh)
            </label>
            <input
              type="text"
              required
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>
        </div>
      </div>

      {/* Courier & Shipping Rates */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <h3>Courier Delivery Rates (Bangladesh)</h3>
            <p>Standard delivery charges calculated during customer checkout.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Inside Dhaka Rate (BDT)
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.insideDhakaShipping}
              onChange={(e) => setFormData({ ...formData, insideDhakaShipping: parseInt(e.target.value, 10) || 0 })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Outside Dhaka Rate (BDT)
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.outsideDhakaShipping}
              onChange={(e) => setFormData({ ...formData, outsideDhakaShipping: parseInt(e.target.value, 10) || 0 })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Free Shipping Threshold (BDT)
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.freeShippingThreshold}
              onChange={(e) => setFormData({ ...formData, freeShippingThreshold: parseInt(e.target.value, 10) || 0 })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>
        </div>
      </div>

      {/* Inventory & Operational Alerts */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <h3>Inventory Thresholds & Alerts</h3>
            <p>Thresholds for low stock notifications in the store owner action centre.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Low Stock Warning Threshold (Units)
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 5 })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Operating Hours
            </label>
            <input
              type="text"
              required
              value={formData.operatingHours}
              onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          <Save size={14} />
          <span>{saving ? "Saving Changes…" : "Save Store Settings"}</span>
        </button>
      </div>
    </form>

    {/* Section: Admin Security & Account Credentials */}
    <div style={{ maxWidth: "800px", marginTop: "40px", paddingTop: "32px", borderTop: "2px solid var(--admin-border)" }}>
      <div className="admin-page-title-group" style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--admin-text)" }}>
          Admin Security & Credentials
        </h2>
        <p style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
          Manage your administrator access credentials, security keys, and store owner account settings.
        </p>
      </div>

      {/* Admin Identity Badge */}
      <div className="admin-card" style={{ marginBottom: "20px", background: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#111111", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--admin-text)" }}>
                {session?.user.email || "Administrator"}
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--admin-muted)" }}>
                Verified Store Owner · Role: <strong style={{ color: "var(--admin-accent)" }}>ADMIN</strong>
              </p>
            </div>
          </div>
          <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700 }}>
            ACCESS GRANTED
          </span>
        </div>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handleUpdatePassword} className="admin-card" style={{ marginBottom: "20px" }}>
        <div className="admin-card-header">
          <div className="admin-card-title">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <KeyRound size={16} />
              <span>Change Admin Password</span>
            </h3>
            <p>Update the password used to access the HIMATU Admin Control Center.</p>
          </div>
        </div>

        {passwordFeedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "12px",
              fontWeight: 700,
              background: passwordFeedback.ok ? "#ecfdf5" : "#fef2f2",
              color: passwordFeedback.ok ? "#065f46" : "#991b1b",
              border: `1px solid ${passwordFeedback.ok ? "#a7f3d0" : "#fecaca"}`,
            }}
          >
            {passwordFeedback.msg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              New Admin Password
            </label>
            <input
              type="password"
              minLength={8}
              required
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              minLength={8}
              required
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={passwordUpdating}>
            <Lock size={13} />
            <span>{passwordUpdating ? "Updating Password…" : "Update Password"}</span>
          </button>
        </div>
      </form>

      {/* Update Admin Profile Details */}
      <form onSubmit={handleUpdateProfile} className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={16} />
              <span>Admin Profile Details</span>
            </h3>
            <p>Update store owner full name and personal contact phone.</p>
          </div>
        </div>

        {profileFeedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "12px",
              fontWeight: 700,
              background: profileFeedback.ok ? "#ecfdf5" : "#fef2f2",
              color: profileFeedback.ok ? "#065f46" : "#991b1b",
              border: `1px solid ${profileFeedback.ok ? "#a7f3d0" : "#fecaca"}`,
            }}
          >
            {profileFeedback.msg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Admin Full Name
            </label>
            <input
              type="text"
              required
              value={adminFullName}
              onChange={(e) => setAdminFullName(e.target.value)}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
              Admin Mobile Phone
            </label>
            <input
              type="tel"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="+880 1..."
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button type="submit" className="admin-btn admin-btn--secondary" disabled={profileUpdating}>
            <Save size={13} />
            <span>{profileUpdating ? "Saving Profile…" : "Update Profile"}</span>
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}

