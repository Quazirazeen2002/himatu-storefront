"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Package,
  MapPin,
  ExternalLink,
  X,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import { getAdminCustomers, getAdminCustomerDetail } from "@/lib/commerce-api";
import type { AdminCustomerDto } from "@himatu/shared";

export function CustomerDirectory() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<AdminCustomerDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCustomers = async (token: string, p = page, s = search) => {
    try {
      const data = await getAdminCustomers(token, {
        page: p,
        limit: 20,
        search: s.trim() || undefined,
      });
      setCustomers(Array.isArray(data?.items) ? data.items : []);
      setTotalCount(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setCustomers([]);
    }
  };

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      if (s?.accessToken && s.user.role === "ADMIN") {
        loadCustomers(s.accessToken).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    if (session?.accessToken) {
      loadCustomers(session.accessToken, 1, search);
    }
  };

  const openCustomerDetail = async (id: string) => {
    if (!session?.accessToken) return;
    setSelectedCustomerId(id);
    setDetailLoading(true);
    try {
      const detail = await getAdminCustomerDetail(session.accessToken, id);
      setCustomerDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatBDT = (amount: number) =>
    `৳${new Intl.NumberFormat("en-BD").format(amount)}`;

  if (loading) {
    return <p style={{ padding: "40px", fontWeight: 700 }}>LOADING CUSTOMER DIRECTORY…</p>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Customer Accounts Directory</h1>
          <p>Verified collectors registered across Bangladesh, order histories, and delivery profiles.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700 }}>
            {totalCount} Registered Collectors
          </span>

          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", width: "320px" }}>
            <input
              type="search"
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                height: "36px",
                padding: "0 12px",
                borderRadius: "4px",
                border: "1px solid var(--admin-border)",
                fontSize: "12px",
              }}
            />
            <button type="submit" className="admin-btn admin-btn--secondary" style={{ height: "36px", fontSize: "11px" }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-card">
        {!Array.isArray(customers) || customers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-muted)" }}>
            No registered customers found matching your search.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Member Since</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const joinDate = new Date(c.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 800 }}>{c.fullName || "Collector"}</td>
                      <td style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{c.email}</td>
                      <td style={{ fontSize: "12px" }}>{c.phone || "—"}</td>
                      <td>
                        <span className={`admin-badge ${c.role === "ADMIN" ? "admin-badge--red" : "admin-badge--gray"}`}>
                          {c.role}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{c.orderCount} orders</td>
                      <td style={{ fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                        {formatBDT(c.totalSpent)}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{joinDate}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary"
                          style={{ height: "30px", padding: "0 10px", fontSize: "11px" }}
                          onClick={() => openCustomerDetail(c.id)}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomerId && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCustomerId(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "640px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Customer Collector Profile</h3>
              <button type="button" onClick={() => setSelectedCustomerId(null)} style={{ background: "transparent", border: 0, cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {detailLoading || !customerDetail ? (
                <p style={{ textAlign: "center", padding: "30px" }}>Loading customer records…</p>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "var(--admin-bg)", borderRadius: "6px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#111111", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "18px" }}>
                      {customerDetail.fullName ? customerDetail.fullName.slice(0, 2).toUpperCase() : "C"}
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>{customerDetail.fullName}</h4>
                      <div style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{customerDetail.email}</div>
                      {customerDetail.phone && (
                        <div style={{ fontSize: "12px", color: "var(--admin-muted)" }}>{customerDetail.phone}</div>
                      )}
                    </div>
                  </div>

                  {/* Saved Addresses */}
                  <div>
                    <h4 style={{ margin: "16px 0 8px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--admin-muted)" }}>
                      Saved Shipping Addresses ({customerDetail.addresses?.length || 0})
                    </h4>
                    {customerDetail.addresses?.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "var(--admin-muted)" }}>No shipping addresses saved yet.</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {customerDetail.addresses?.map((addr: any) => (
                          <div key={addr.id} style={{ padding: "12px", border: "1px solid var(--admin-border)", borderRadius: "4px", fontSize: "12px" }}>
                            <div style={{ fontWeight: 700 }}>{addr.recipientName} {addr.isDefault && "(Default)"}</div>
                            <div style={{ color: "var(--admin-muted)", marginTop: "2px" }}>{addr.fullAddress}</div>
                            <div style={{ fontWeight: 600 }}>{addr.area}, {addr.district}</div>
                            <div style={{ marginTop: "4px" }}>{addr.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Past Orders */}
                  <div>
                    <h4 style={{ margin: "16px 0 8px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--admin-muted)" }}>
                      Order History ({customerDetail.orders?.length || 0})
                    </h4>
                    {customerDetail.orders?.length === 0 ? (
                      <p style={{ fontSize: "12px", color: "var(--admin-muted)" }}>No orders placed by this customer yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {customerDetail.orders?.map((ord: any) => (
                          <div
                            key={ord.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              border: "1px solid var(--admin-border)",
                              borderRadius: "4px",
                              fontSize: "12px",
                            }}
                          >
                            <div>
                              <strong style={{ fontFamily: "var(--font-metadata, monospace)" }}>#{ord.orderNumber}</strong>
                              <span style={{ color: "var(--admin-muted)", marginLeft: "8px" }}>
                                {new Date(ord.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <span style={{ fontWeight: 800 }}>{formatBDT(ord.totalAmount)}</span>
                              <span className="admin-badge admin-badge--gray">{ord.orderStatus}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setSelectedCustomerId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

