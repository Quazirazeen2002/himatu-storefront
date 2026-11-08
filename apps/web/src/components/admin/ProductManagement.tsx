"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Upload,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Boxes,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import {
  getAdminProducts,
  getCategories,
  createAdminProduct,
  updateAdminProduct,
  archiveAdminProduct,
  adjustAdminInventory,
  uploadProductImages,
  updateProductImage,
  reorderProductImages,
  deleteProductImage,
} from "@/lib/commerce-api";
import type { CategoryDto, ProductDto, ProductImageDto } from "@himatu/shared";

export function ProductManagement() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [managingImagesProduct, setManagingImagesProduct] = useState<ProductDto | null>(null);
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<ProductDto | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    shortDescription: "",
    description: "",
    price: 0,
    salePrice: 0,
    categoryId: "",
    isActive: true,
    isFeatured: false,
    initialStock: 10,
    specifications: {
      Scale: "1/8 Scale",
      Height: "24 cm",
      Material: "PVC & ABS",
      Series: "Anime Collectible",
      Manufacturer: "Official",
    } as Record<string, string>,
  });

  const [stockInput, setStockInput] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBDT = (amount: number) =>
    `৳${new Intl.NumberFormat("en-BD").format(amount)}`;

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = async (token: string) => {
    try {
      const [prodRes, catRes] = await Promise.all([
        getAdminProducts(token, {
          page,
          limit: 15,
          search: search.trim() || undefined,
          category: categoryFilter || undefined,
        }),
        getCategories(),
      ]);

      setProducts(prodRes.items);
      setTotalPages(prodRes.totalPages);
      setTotalCount(prodRes.total);
      setCategories(catRes);

      if (managingImagesProduct) {
        const refreshed = prodRes.items.find((p) => p.id === managingImagesProduct.id);
        if (refreshed) setManagingImagesProduct(refreshed);
      }
    } catch (err: any) {
      console.error("Failed to load products:", err);
      showFeedback("error", err.message || "Failed to load product catalogue.");
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const s = await authService.getSession();
        setSession(s);
        if (s?.accessToken && s.user.role === "ADMIN") {
          await loadData(s.accessToken);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [page, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (session?.accessToken) {
      setPage(1);
      loadData(session.accessToken);
    }
  };

  // Open Create Modal
  const openCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      slug: "",
      sku: `HMT-${Date.now().toString().slice(-4)}`,
      shortDescription: "",
      description: "",
      price: 0,
      salePrice: 0,
      categoryId: categories[0]?.id || "",
      isActive: true,
      isFeatured: false,
      initialStock: 10,
      specifications: {
        Scale: "1/8 Scale",
        Height: "24 cm",
        Material: "PVC & ABS",
        Series: "Anime Collectible",
        Manufacturer: "Official",
      },
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEdit = (product: ProductDto) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      shortDescription: product.shortDescription || "",
      description: product.description,
      price: product.price,
      salePrice: product.salePrice || 0,
      categoryId: product.categoryId,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      initialStock: product.inventory?.quantity || 0,
      specifications: (product.specifications as Record<string, string>) || {
        Scale: "1/8 Scale",
        Height: "24 cm",
        Material: "PVC & ABS",
      },
    });
    setIsCreateModalOpen(true);
  };

  // Submit Product Form
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      if (editingProduct) {
        await updateAdminProduct(session.accessToken, editingProduct.id, {
          name: formData.name,
          slug: formData.slug,
          sku: formData.sku,
          shortDescription: formData.shortDescription,
          description: formData.description,
          price: formData.price,
          salePrice: formData.salePrice || undefined,
          categoryId: formData.categoryId,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          specifications: formData.specifications,
        });
        showFeedback("success", `Updated product "${formData.name}" successfully.`);
      } else {
        await createAdminProduct(session.accessToken, {
          name: formData.name,
          slug: formData.slug,
          sku: formData.sku,
          shortDescription: formData.shortDescription,
          description: formData.description,
          price: formData.price,
          salePrice: formData.salePrice || undefined,
          categoryId: formData.categoryId,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          initialStock: formData.initialStock,
          specifications: formData.specifications,
        });
        showFeedback("success", `Created new collectible "${formData.name}".`);
      }

      setIsCreateModalOpen(false);
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to save product.");
    }
  };

  // Archive Product
  const handleArchive = async (product: ProductDto) => {
    if (!session?.accessToken) return;
    if (!confirm(`Archive "${product.name}"? It will no longer be visible on the public storefront.`)) {
      return;
    }

    try {
      await archiveAdminProduct(session.accessToken, product.id);
      showFeedback("success", `Archived "${product.name}".`);
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to archive product.");
    }
  };

  // Adjust Stock
  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockProduct || !session?.accessToken) return;

    try {
      await adjustAdminInventory(
        session.accessToken,
        adjustingStockProduct.id,
        stockInput,
        adjustingStockProduct.inventory?.reservedQuantity || 0,
      );
      showFeedback("success", `Inventory updated for ${adjustingStockProduct.name} to ${stockInput} units.`);
      setAdjustingStockProduct(null);
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to adjust inventory.");
    }
  };

  // Upload Images
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !managingImagesProduct || !session?.accessToken) return;
    setUploadingImages(true);
    setUploadError(null);

    try {
      const fileArray = Array.from(files);
      const fd = new FormData();
      fileArray.forEach((file) => fd.append("images", file));

      await uploadProductImages(session.accessToken, managingImagesProduct.id, fd);
      showFeedback("success", `Uploaded ${fileArray.length} photograph(s) to Supabase Storage.`);
      await loadData(session.accessToken);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please check image format & size.");
      showFeedback("error", err.message || "Upload failed");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Set Primary Image
  const handleSetPrimary = async (imageId: string) => {
    if (!managingImagesProduct || !session?.accessToken) return;
    try {
      await updateProductImage(session.accessToken, managingImagesProduct.id, imageId, {
        isPrimary: true,
      });
      showFeedback("success", "Primary cover photograph updated.");
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to set primary image");
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId: string) => {
    if (!managingImagesProduct || !session?.accessToken) return;
    if (!confirm("Delete this photograph from Supabase Storage and database?")) return;

    try {
      await deleteProductImage(session.accessToken, managingImagesProduct.id, imageId);
      showFeedback("success", "Photograph deleted.");
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to delete photograph");
    }
  };

  // Reorder Images
  const handleMoveImage = async (index: number, direction: "up" | "down") => {
    if (!managingImagesProduct || !session?.accessToken) return;
    const images = [...managingImagesProduct.images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const temp = images[index];
    images[index] = images[targetIndex];
    images[targetIndex] = temp;

    const items = images.map((img, idx) => ({
      imageId: img.id,
      sortOrder: idx,
    }));

    try {
      await reorderProductImages(session.accessToken, managingImagesProduct.id, items);
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to reorder images");
    }
  };

  if (loading) {
    return <p style={{ padding: "40px", fontWeight: 700 }}>LOADING PRODUCT CATALOGUE…</p>;
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <AlertCircle size={48} style={{ color: "var(--admin-accent, #d92727)", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>RESTRICTED ACCESS</h2>
        <p style={{ color: "var(--admin-muted)", marginBottom: "24px" }}>
          This product management console requires verified administrator privileges.
        </p>
        <Link href="/shop" className="admin-btn admin-btn--secondary">
          Return to Storefront
        </Link>
      </div>
    );
  }

  const activeCount = products.filter((p) => p.isActive).length;
  const lowStockCount = products.filter((p) => (p.inventory?.quantity ?? 0) <= 5 && (p.inventory?.quantity ?? 0) > 0).length;
  const outOfStockCount = products.filter((p) => (p.inventory?.quantity ?? 0) === 0).length;

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Product Catalogue & Inventory</h1>
          <p>Curate authentic anime figure catalogue, manage inventory, and upload high-resolution photographs.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-btn admin-btn--primary" onClick={openCreate}>
            <Plus size={15} />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "13px",
            fontWeight: 700,
            background: feedback.type === "success" ? "var(--admin-success-soft)" : "rgba(217, 39, 39, 0.08)",
            color: feedback.type === "success" ? "var(--admin-success)" : "var(--admin-accent)",
            border: `1px solid ${feedback.type === "success" ? "var(--admin-success)" : "var(--admin-accent)"}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI Summary Grid */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "20px" }}>
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Total Catalogue</span>
            <div className="admin-kpi-icon" style={{ color: "var(--admin-text)" }}>
              <Package size={16} />
            </div>
          </div>
          <div className="admin-kpi-value">{totalCount}</div>
          <div className="admin-kpi-subtext">Curated figures & test items</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Active on Storefront</span>
            <div className="admin-kpi-icon" style={{ color: "var(--admin-success)" }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: "var(--admin-success)" }}>
            {activeCount}
          </div>
          <div className="admin-kpi-subtext">Visible to collectors</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Low Stock (≤ 5)</span>
            <div className="admin-kpi-icon" style={{ color: "#d97706" }}>
              <Boxes size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: "#d97706" }}>
            {lowStockCount}
          </div>
          <div className="admin-kpi-subtext">Replenishment recommended</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Out of Stock</span>
            <div className="admin-kpi-icon" style={{ color: "#ef4444" }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="admin-kpi-value" style={{ color: "#ef4444" }}>
            {outOfStockCount}
          </div>
          <div className="admin-kpi-subtext">Available for pre-order or re-stock</div>
        </div>
      </div>

      {/* Toolbar: Category Filter & Search Bar */}
      <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          {/* Categories Filter Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("");
                setPage(1);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "4px",
                border: 0,
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                background: categoryFilter === "" ? "#111111" : "#f3f4f6",
                color: categoryFilter === "" ? "#ffffff" : "var(--admin-muted)",
                transition: "all 0.15s ease",
              }}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(c.slug);
                  setPage(1);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "4px",
                  border: 0,
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  background: categoryFilter === c.slug ? "#111111" : "#f3f4f6",
                  color: categoryFilter === c.slug ? "#ffffff" : "var(--admin-muted)",
                  transition: "all 0.15s ease",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Box & Refresh */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <form onSubmit={handleSearchSubmit} style={{ position: "relative", width: "260px" }}>
              <input
                type="search"
                placeholder="Search title, SKU, character…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  padding: "0 12px 0 34px",
                  borderRadius: "4px",
                  border: "1px solid var(--admin-border)",
                  fontSize: "12px",
                  background: "var(--admin-surface)",
                  color: "var(--admin-text)",
                }}
              />
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "11px",
                  top: "11px",
                  color: "var(--admin-muted)",
                }}
              />
            </form>

            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              style={{ height: "36px", width: "36px", padding: 0 }}
              onClick={() => session?.accessToken && loadData(session.accessToken)}
              title="Refresh catalogue"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item & Photography</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price (BDT)</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--admin-muted)" }}>
                    No anime collectibles found matching current filter.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const primaryImage =
                    prod.images.find((img) => img.isPrimary) || prod.images[0];
                  const stock = prod.inventory?.availableQuantity ?? 0;

                  return (
                    <tr key={prod.id}>
                      {/* Product Thumbnail + Name */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {primaryImage ? (
                            <img
                              src={primaryImage.imageUrl}
                              alt={primaryImage.altText || prod.name}
                              style={{
                                width: "42px",
                                height: "42px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                border: "1px solid var(--admin-border)",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                background: "#f3f4f6",
                                borderRadius: "4px",
                                border: "1px solid var(--admin-border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--admin-muted)",
                                flexShrink: 0,
                              }}
                            >
                              <Package size={20} />
                            </div>
                          )}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Link
                                href={`/products/${prod.slug}`}
                                style={{
                                  fontWeight: 700,
                                  color: "var(--admin-text)",
                                  textDecoration: "none",
                                }}
                              >
                                {prod.name}
                              </Link>
                              {prod.isFeatured && (
                                <span className="admin-badge admin-badge--purple" style={{ fontSize: "9px", padding: "1px 6px" }}>
                                  Featured
                                </span>
                              )}
                            </div>
                            {prod.shortDescription && (
                              <p style={{ fontSize: "11px", color: "var(--admin-muted)", margin: "2px 0 0 0", maxWidth: "280px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {prod.shortDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td style={{ fontFamily: "var(--font-metadata, monospace)", fontSize: "12px", color: "var(--admin-muted)" }}>
                        {prod.sku}
                      </td>

                      {/* Category */}
                      <td>
                        <span className="admin-badge admin-badge--gray">
                          {prod.category?.name || "General"}
                        </span>
                      </td>

                      {/* Price */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 800, fontSize: "13px" }}>
                            {formatBDT(prod.price)}
                          </span>
                          {prod.salePrice && prod.salePrice < prod.price && (
                            <span style={{ fontSize: "11px", color: "var(--admin-muted)", textDecoration: "line-through" }}>
                              {formatBDT(prod.salePrice)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingStockProduct(prod);
                            setStockInput(prod.inventory?.quantity ?? 0);
                          }}
                          style={{
                            background: "transparent",
                            border: 0,
                            padding: 0,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                          title="Click to adjust inventory"
                        >
                          {stock === 0 ? (
                            <span className="admin-badge admin-badge--red">Out of Stock</span>
                          ) : stock <= 5 ? (
                            <span className="admin-badge admin-badge--amber">Low Stock ({stock})</span>
                          ) : (
                            <span className="admin-badge admin-badge--green">{stock} in stock</span>
                          )}
                        </button>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`admin-badge ${prod.isActive ? "admin-badge--green" : "admin-badge--gray"}`}>
                          {prod.isActive ? "Active" : "Archived"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary"
                            style={{ height: "30px", padding: "0 10px", fontSize: "11px" }}
                            onClick={() => setManagingImagesProduct(prod)}
                            title="Manage photographs"
                          >
                            <Upload size={12} />
                            <span>Photos ({prod.images.length})</span>
                          </button>

                          <button
                            type="button"
                            className="admin-btn admin-btn--secondary"
                            style={{ height: "30px", padding: "0 10px", fontSize: "11px" }}
                            onClick={() => openEdit(prod)}
                            title="Edit details"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>

                          {prod.isActive && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--danger"
                              style={{ height: "30px", padding: "0 8px", fontSize: "11px" }}
                              onClick={() => handleArchive(prod)}
                              title="Archive figure"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderTop: "1px solid var(--admin-border)",
            fontSize: "12px",
            color: "var(--admin-muted)",
          }}
        >
          <div>
            Showing <strong>{products.length}</strong> of <strong>{totalCount}</strong> collectibles
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              style={{ height: "30px", padding: "0 12px", fontSize: "11px" }}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                if (session?.accessToken) loadData(session.accessToken);
              }}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span style={{ fontWeight: 700, padding: "0 6px" }}>
              Page {page} of {totalPages || 1}
            </span>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              style={{ height: "30px", padding: "0 12px", fontSize: "11px" }}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                if (session?.accessToken) loadData(session.accessToken);
              }}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isCreateModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: "680px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>{editingProduct ? "Edit Collectible Figure" : "Add New Collectible Statue"}</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: "transparent", border: 0, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          name,
                          slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                        }));
                      }}
                      placeholder="e.g. Luffy · Gear Five"
                      style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                      Unique SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g. HMT-OP-001"
                      style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g. straw-hat-captain"
                      style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                      Anime Category *
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px", background: "var(--admin-surface)" }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                      Price in BDT *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.price || ""}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="6500"
                      style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                      Sale Price (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.salePrice || ""}
                      onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                      placeholder="5900"
                      style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                    />
                  </div>

                  {!editingProduct && (
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                        Initial Stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.initialStock}
                        onChange={(e) =>
                          setFormData({ ...formData, initialStock: Number(e.target.value) })
                        }
                        style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                    Short Summary (Catalogue Card)
                  </label>
                  <input
                    type="text"
                    maxLength={500}
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Luffy in Gear Five, seated with dynamic blue cloud effect pieces."
                    style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                    Full Curated Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe material composition, sculpting highlights, collector provenance..."
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--admin-border)", borderRadius: "4px", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "24px", paddingTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Active on Public Storefront</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    <span>Featured Hero Collection</span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="admin-btn admin-btn--secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUST MODAL */}
      {adjustingStockProduct && (
        <div className="admin-modal-backdrop" onClick={() => setAdjustingStockProduct(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: "440px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>Adjust Inventory Stock</h3>
              <button
                type="button"
                onClick={() => setAdjustingStockProduct(null)}
                style={{ background: "transparent", border: 0, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockAdjust}>
              <div className="admin-modal-body">
                <p style={{ fontSize: "13px", color: "var(--admin-muted)", marginBottom: "16px" }}>
                  Product: <strong style={{ color: "var(--admin-text)" }}>{adjustingStockProduct.name}</strong> ({adjustingStockProduct.sku})
                </p>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                    Total Available Physical Units *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockInput}
                    onChange={(e) => setStockInput(Number(e.target.value))}
                    style={{ width: "100%", height: "40px", padding: "0 12px", border: "1px solid var(--admin-border)", borderRadius: "4px", fontSize: "14px", fontWeight: 800 }}
                  />
                  <span style={{ display: "block", fontSize: "11px", color: "var(--admin-muted)", marginTop: "6px" }}>
                    Reserved for active checkouts: {adjustingStockProduct.inventory?.reservedQuantity || 0} units
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setAdjustingStockProduct(null)}
                  className="admin-btn admin-btn--secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPABASE STORAGE IMAGE UPLOAD & GALLERY MODAL */}
      {managingImagesProduct && (
        <div className="admin-modal-backdrop" onClick={() => setManagingImagesProduct(null)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: "780px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3>Supabase Storage Photographs</h3>
                <p style={{ fontSize: "12px", color: "var(--admin-muted)", margin: "4px 0 0 0" }}>
                  Figure: <strong>{managingImagesProduct.name}</strong> ({managingImagesProduct.sku})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingImagesProduct(null)}
                style={{ background: "transparent", border: 0, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Drag & Drop Upload Zone */}
              <div
                style={{
                  border: "2px dashed var(--admin-border)",
                  borderRadius: "8px",
                  padding: "28px",
                  textAlign: "center",
                  background: uploadingImages ? "var(--admin-bg)" : "var(--admin-surface)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Upload size={30} style={{ color: "var(--admin-muted)", margin: "0 auto 10px" }} />
                <h4 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 4px 0" }}>
                  DRAG & DROP PHOTOGRAPHS HERE
                </h4>
                <p style={{ fontSize: "12px", color: "var(--admin-muted)", margin: 0 }}>
                  Supports JPEG, PNG, WebP up to 10MB each. Uploads directly to Supabase bucket.
                </p>

                {uploadingImages && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "6px 12px", background: "#f3f4f6", borderRadius: "100px", fontSize: "11px", fontWeight: 700 }}>
                    <RefreshCw className="animate-spin" size={13} />
                    <span>Uploading photographs to Supabase Storage…</span>
                  </div>
                )}
                {uploadError && (
                  <p style={{ color: "var(--admin-accent)", fontSize: "12px", fontWeight: 700, marginTop: "10px" }}>
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Gallery List */}
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", color: "var(--admin-muted)", textTransform: "uppercase", marginBottom: "12px" }}>
                  Current Photographs ({managingImagesProduct.images.length})
                </h4>

                {managingImagesProduct.images.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--admin-muted)", textAlign: "center", padding: "20px 0" }}>
                    No photographs uploaded yet for this figure.
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                    {managingImagesProduct.images.map((img, idx) => (
                      <div
                        key={img.id}
                        style={{
                          border: img.isPrimary ? "2px solid var(--admin-accent, #d92727)" : "1px solid var(--admin-border)",
                          borderRadius: "6px",
                          overflow: "hidden",
                          background: "var(--admin-surface)",
                          position: "relative",
                        }}
                      >
                        <div style={{ position: "relative", height: "160px", background: "#f9fafb" }}>
                          <img
                            src={img.imageUrl}
                            alt={img.altText || "Photograph"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          {img.isPrimary && (
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                left: "8px",
                                background: "var(--admin-accent, #d92727)",
                                color: "#ffffff",
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Star size={10} fill="#ffffff" />
                              <span>PRIMARY</span>
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            padding: "8px 10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderTop: "1px solid var(--admin-border)",
                            background: "var(--admin-surface)",
                          }}
                        >
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--admin-muted)" }}>
                            Order #{img.sortOrder + 1}
                          </span>

                          <div style={{ display: "flex", gap: "4px" }}>
                            {!img.isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(img.id)}
                                className="admin-btn admin-btn--secondary"
                                style={{ height: "26px", width: "26px", padding: 0 }}
                                title="Set as primary"
                              >
                                <Star size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, "up")}
                              disabled={idx === 0}
                              className="admin-btn admin-btn--secondary"
                              style={{ height: "26px", width: "26px", padding: 0 }}
                              title="Move up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, "down")}
                              disabled={idx === managingImagesProduct.images.length - 1}
                              className="admin-btn admin-btn--secondary"
                              style={{ height: "26px", width: "26px", padding: 0 }}
                              title="Move down"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="admin-btn admin-btn--danger"
                              style={{ height: "26px", width: "26px", padding: 0 }}
                              title="Delete photograph"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setManagingImagesProduct(null)}
                className="admin-btn admin-btn--primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
