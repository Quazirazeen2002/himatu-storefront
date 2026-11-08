"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Edit2,
  RefreshCw,
  X,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import { getAdminProducts, adjustAdminInventory } from "@/lib/commerce-api";
import type { ProductDto } from "@himatu/shared";

export function InventoryManagement() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [adjusting, setAdjusting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadInventory = async (token: string) => {
    try {
      const data = await getAdminProducts(token, { limit: 100 });
      setProducts(data.items);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      if (s?.accessToken && s.user.role === "ADMIN") {
        loadInventory(s.accessToken).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, []);

  const openAdjust = (prod: ProductDto) => {
    setSelectedProduct(prod);
    setNewStock(prod.inventory?.quantity ?? 0);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !session?.accessToken) return;
    setAdjusting(true);
    try {
      await adjustAdminInventory(session.accessToken, selectedProduct.id, newStock);
      setFeedback(`Inventory for "${selectedProduct.name}" updated to ${newStock} units.`);
      setSelectedProduct(null);
      await loadInventory(session.accessToken);
    } catch (err: any) {
      alert(err.message || "Failed to update stock");
    } finally {
      setAdjusting(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const filtered = products.filter((p) => {
    const qty = p.inventory?.quantity ?? 0;
    if (filter === "low" && (qty > 5 || qty === 0)) return false;
    if (filter === "out" && qty > 0) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
    }
    return true;
  });

  if (loading) {
    return <p style={{ padding: "40px", fontWeight: 700 }}>LOADING INVENTORY WORKSPACE…</p>;
  }

  const lowCount = products.filter((p) => (p.inventory?.quantity ?? 0) <= 5 && (p.inventory?.quantity ?? 0) > 0).length;
  const outCount = products.filter((p) => (p.inventory?.quantity ?? 0) === 0).length;

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Inventory & Stock Control</h1>
          <p>Monitor warehouse quantities, set availability thresholds, and adjust inventory levels.</p>
        </div>
      </div>

      {feedback && (
        <div style={{ padding: "12px 18px", background: "var(--admin-success-soft)", border: "1px solid var(--admin-success)", color: "var(--admin-success)", borderRadius: "6px", marginBottom: "20px", fontWeight: 700, fontSize: "13px" }}>
          {feedback}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setFilter("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                border: 0,
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                background: filter === "all" ? "#111111" : "#f3f4f6",
                color: filter === "all" ? "#ffffff" : "var(--admin-muted)",
              }}
            >
              All Items ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("low")}
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                border: 0,
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                background: filter === "low" ? "#d97706" : "#f3f4f6",
                color: filter === "low" ? "#ffffff" : "#d97706",
              }}
            >
              Low Stock (≤5) ({lowCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("out")}
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                border: 0,
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                background: filter === "out" ? "#ef4444" : "#f3f4f6",
                color: filter === "out" ? "#ffffff" : "#ef4444",
              }}
            >
              Out of Stock ({outCount})
            </button>
          </div>

          <div style={{ width: "260px" }}>
            <input
              type="search"
              placeholder="Filter by name or SKU…"
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
        </div>
      </div>

      {/* Stock Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Figure</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Total Stock</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prod) => {
                const total = prod.inventory?.quantity ?? 0;
                const reserved = prod.inventory?.reservedQuantity ?? 0;
                const available = Math.max(0, total - reserved);

                const statusBadge =
                  total === 0 ? (
                    <span className="admin-badge admin-badge--red">Out of Stock</span>
                  ) : total <= 5 ? (
                    <span className="admin-badge admin-badge--amber">Low Stock ({total})</span>
                  ) : (
                    <span className="admin-badge admin-badge--green">In Stock ({total})</span>
                  );

                const primaryImage = prod.images?.find((img) => img.isPrimary) || prod.images?.[0];

                return (
                  <tr key={prod.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {primaryImage ? (
                          <img
                            src={primaryImage.imageUrl}
                            alt={prod.name}
                            style={{ width: "38px", height: "38px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--admin-border)" }}
                          />
                        ) : (
                          <div style={{ width: "38px", height: "38px", background: "#eee", borderRadius: "4px" }} />
                        )}
                        <span style={{ fontWeight: 700 }}>{prod.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-metadata, monospace)", fontSize: "11px", color: "var(--admin-muted)" }}>
                      {prod.sku}
                    </td>
                    <td>
                      <span className="admin-badge admin-badge--gray">{prod.category?.name || "Anime"}</span>
                    </td>
                    <td style={{ fontWeight: 800 }}>{total}</td>
                    <td style={{ color: "var(--admin-muted)" }}>{reserved}</td>
                    <td style={{ fontWeight: 800, color: available > 0 ? "var(--admin-text)" : "#ef4444" }}>
                      {available}
                    </td>
                    <td>{statusBadge}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        style={{ height: "30px", padding: "0 10px", fontSize: "11px" }}
                        onClick={() => openAdjust(prod)}
                      >
                        <Edit2 size={12} />
                        <span>Update Stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Update Inventory Stock</h3>
              <button type="button" onClick={() => setSelectedProduct(null)} style={{ background: "transparent", border: 0, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              <div className="admin-modal-body">
                <div>
                  <h4 style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 800 }}>{selectedProduct.name}</h4>
                  <span style={{ fontSize: "11px", color: "var(--admin-muted)", fontFamily: "var(--font-metadata, monospace)" }}>
                    SKU: {selectedProduct.sku}
                  </span>
                </div>

                <div style={{ margin: "16px 0" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                    Warehouse Quantity (Units)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      style={{ width: "40px", height: "40px", padding: 0 }}
                      onClick={() => setNewStock((prev) => Math.max(0, prev - 1))}
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      style={{
                        flex: 1,
                        height: "40px",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: 800,
                        border: "1px solid var(--admin-border)",
                        borderRadius: "4px",
                      }}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      style={{ width: "40px", height: "40px", padding: 0 }}
                      onClick={() => setNewStock((prev) => prev + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "var(--admin-muted)" }}>
                  Direct inventory mutations record instantaneous availability changes across all storefront collection views.
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setSelectedProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={adjusting}>
                  {adjusting ? "Saving…" : "Confirm Stock Level"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

