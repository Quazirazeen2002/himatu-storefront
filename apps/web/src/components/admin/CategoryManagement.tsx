"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Edit2,
  Check,
  X,
  RefreshCw,
  FolderTree,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import {
  getCategories,
  createAdminCategory,
  updateAdminCategory,
} from "@/lib/commerce-api";
import type { CategoryDto } from "@himatu/shared";

export function CategoryManagement() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryDto | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const cats = await getCategories();
      if (Array.isArray(cats)) {
        setCategories(cats);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error("Failed to load categories:", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      loadData().finally(() => setLoading(false));
    });
  }, []);

  const openCreate = () => {
    setEditingCat(null);
    setName("");
    setSlug("");
    setDescription("");
    setDisplayOrder(categories.length);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryDto) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setDisplayOrder(cat.displayOrder);
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;
    setSaving(true);
    try {
      if (editingCat) {
        await updateAdminCategory(session.accessToken, editingCat.id, {
          name,
          slug,
          description: description || undefined,
          displayOrder,
          isActive,
        });
        setFeedback(`Category "${name}" updated.`);
      } else {
        await createAdminCategory(session.accessToken, {
          name,
          slug,
          description: description || undefined,
          displayOrder,
        });
        setFeedback(`Category "${name}" created.`);
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save category");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const toggleStatus = async (cat: CategoryDto) => {
    if (!session?.accessToken) return;
    try {
      await updateAdminCategory(session.accessToken, cat.id, {
        isActive: !cat.isActive,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update category status");
    }
  };

  if (loading) {
    return <p style={{ padding: "30px", fontWeight: 700 }}>LOADING CATEGORIES…</p>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Anime Categories</h1>
          <p>Organize anime universes, franchises, and collection hierarchies.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate}>
            <Plus size={15} />
            <span>+ Add Category</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ padding: "12px 18px", background: "var(--admin-success-soft)", border: "1px solid var(--admin-success)", color: "var(--admin-success)", borderRadius: "6px", marginBottom: "20px", fontWeight: 700, fontSize: "13px" }}>
          {feedback}
        </div>
      )}

      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Order</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(categories) || categories.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--admin-muted)" }}>
                    No categories found. Click &quot;+ Add Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                  <td style={{ fontWeight: 800 }}>{c.name}</td>
                  <td style={{ fontFamily: "var(--font-metadata, monospace)", fontSize: "12px", color: "var(--admin-muted)" }}>
                    {c.slug}
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--admin-muted)", maxWidth: "300px" }}>
                    {c.description || "—"}
                  </td>
                  <td style={{ fontWeight: 700 }}>{c.displayOrder}</td>
                  <td>
                    <span className={`admin-badge ${c.isActive ? "admin-badge--green" : "admin-badge--gray"}`}>
                      {c.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        style={{ height: "30px", padding: "0 10px", fontSize: "11px" }}
                        onClick={() => openEdit(c)}
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        style={{ height: "30px", padding: "0 10px", fontSize: "11px" }}
                        onClick={() => toggleStatus(c)}
                      >
                        {c.isActive ? "Hide" : "Show"}
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingCat ? "Edit Category" : "Add Anime Universe Category"}</h3>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. One Piece, Naruto, Bleach"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCat) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, ""),
                        );
                      }
                    }}
                    style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                    Unique URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. one-piece"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of this anime franchise..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                      Display Order Priority
                    </label>
                    <input
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                      style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                    />
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", paddingTop: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <span>Active on Storefront</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                  {saving ? "Saving…" : editingCat ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

