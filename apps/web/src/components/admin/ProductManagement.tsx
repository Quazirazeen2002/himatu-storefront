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
  Eye,
  ShieldCheck,
  RefreshCw,
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

  useEffect(() => {
    async function loadAuth() {
      try {
        const s = await authService.getSession();
        setSession(s);
        if (s?.accessToken && s.user.role === "ADMIN") {
          await loadData(s.accessToken);
        }
      } catch (err) {
        console.error("Auth load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAuth();
  }, []);

  async function loadData(token: string) {
    try {
      const [cats, prods] = await Promise.all([
        getCategories(),
        getAdminProducts(token, {
          page,
          search: search.trim() || undefined,
          category: categoryFilter || undefined,
        }),
      ]);
      setCategories(cats);
      setProducts(prods.items);
      setTotalPages(prods.totalPages);
      setTotalCount(prods.total);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to load catalogue data");
    }
  }

  function showFeedback(type: "success" | "error", text: string) {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session?.accessToken) {
      setPage(1);
      loadData(session.accessToken);
    }
  }

  // Open Create Form
  function openCreate() {
    setFormData({
      name: "",
      slug: "",
      sku: `HMT-${Date.now().toString().slice(-6)}`,
      shortDescription: "",
      description: "",
      price: 5000,
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
      },
    });
    setEditingProduct(null);
    setIsCreateModalOpen(true);
  }

  // Open Edit Form
  function openEdit(prod: ProductDto) {
    setFormData({
      name: prod.name,
      slug: prod.slug,
      sku: prod.sku,
      shortDescription: prod.shortDescription || "",
      description: prod.description,
      price: prod.price,
      salePrice: prod.salePrice || 0,
      categoryId: prod.categoryId,
      isActive: prod.isActive,
      isFeatured: prod.isFeatured,
      initialStock: prod.inventory?.quantity || 0,
      specifications: (prod.specifications as Record<string, string>) || {},
    });
    setEditingProduct(prod);
    setIsCreateModalOpen(true);
  }

  // Submit Create or Edit Product
  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      if (editingProduct) {
        await updateAdminProduct(session.accessToken, editingProduct.id, {
          name: formData.name,
          slug: formData.slug,
          sku: formData.sku,
          shortDescription: formData.shortDescription || null,
          description: formData.description,
          price: Number(formData.price),
          salePrice: Number(formData.salePrice) || null,
          categoryId: formData.categoryId,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          specifications: formData.specifications,
        });
        showFeedback("success", `Updated ${formData.name}`);
      } else {
        await createAdminProduct(session.accessToken, {
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          sku: formData.sku,
          shortDescription: formData.shortDescription || null,
          description: formData.description,
          price: Number(formData.price),
          salePrice: Number(formData.salePrice) || null,
          categoryId: formData.categoryId,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          initialStock: Number(formData.initialStock),
          specifications: formData.specifications,
        });
        showFeedback("success", `Created ${formData.name}`);
      }

      setIsCreateModalOpen(false);
      setEditingProduct(null);
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to save product");
    }
  }

  // Archive Product
  async function handleArchive(prod: ProductDto) {
    if (!session?.accessToken) return;
    if (!confirm(`Archive product "${prod.name}"? It will no longer appear on the public storefront.`)) {
      return;
    }

    try {
      await archiveAdminProduct(session.accessToken, prod.id);
      showFeedback("success", `Archived ${prod.name}`);
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to archive product");
    }
  }

  // Stock Adjustment
  async function handleStockAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.accessToken || !adjustingStockProduct) return;

    try {
      await adjustAdminInventory(session.accessToken, adjustingStockProduct.id, stockInput);
      showFeedback("success", `Stock updated to ${stockInput} units`);
      setAdjustingStockProduct(null);
      await loadData(session.accessToken);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to adjust inventory");
    }
  }

  // Image Upload Handling (Multiple files, drag & drop)
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !managingImagesProduct || !session?.accessToken) return;

    setUploadingImages(true);
    setUploadError(null);

    try {
      const data = new FormData();
      for (let i = 0; i < files.length; i++) {
        data.append("files", files[i]);
      }
      data.append("altText", `${managingImagesProduct.name} collectible photograph`);

      const uploaded = await uploadProductImages(session.accessToken, managingImagesProduct.id, data);
      showFeedback("success", `Uploaded ${uploaded.length} image(s) to Supabase Storage`);

      // Refresh product images
      const refreshedList = await getAdminProducts(session.accessToken, { page });
      setProducts(refreshedList.items);
      const updatedProduct = refreshedList.items.find((p) => p.id === managingImagesProduct.id);
      if (updatedProduct) {
        setManagingImagesProduct(updatedProduct);
      }
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Mark Image as Primary
  async function handleSetPrimary(imageId: string) {
    if (!managingImagesProduct || !session?.accessToken) return;

    try {
      await updateProductImage(session.accessToken, managingImagesProduct.id, imageId, {
        isPrimary: true,
      });
      showFeedback("success", "Primary cover image updated");
      const refreshedList = await getAdminProducts(session.accessToken, { page });
      setProducts(refreshedList.items);
      const updatedProduct = refreshedList.items.find((p) => p.id === managingImagesProduct.id);
      if (updatedProduct) setManagingImagesProduct(updatedProduct);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to set primary image");
    }
  }

  // Delete Image
  async function handleDeleteImage(imageId: string) {
    if (!managingImagesProduct || !session?.accessToken) return;
    if (!confirm("Delete this photograph from Supabase Storage and database?")) return;

    try {
      await deleteProductImage(session.accessToken, managingImagesProduct.id, imageId);
      showFeedback("success", "Photograph deleted");
      const refreshedList = await getAdminProducts(session.accessToken, { page });
      setProducts(refreshedList.items);
      const updatedProduct = refreshedList.items.find((p) => p.id === managingImagesProduct.id);
      if (updatedProduct) setManagingImagesProduct(updatedProduct);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to delete photograph");
    }
  }

  // Reorder Images
  async function handleMoveImage(index: number, direction: "up" | "down") {
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
      const refreshedList = await getAdminProducts(session.accessToken, { page });
      setProducts(refreshedList.items);
      const updatedProduct = refreshedList.items.find((p) => p.id === managingImagesProduct.id);
      if (updatedProduct) setManagingImagesProduct(updatedProduct);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to reorder images");
    }
  }

  if (loading) {
    return (
      <div className="admin-loading-container">
        <RefreshCw className="animate-spin" size={28} />
        <p>Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="admin-forbidden-container">
        <AlertCircle size={48} className="admin-alert-icon" />
        <h2>RESTRICTED ACCESS</h2>
        <p>This product management console requires verified administrator privileges.</p>
        <p className="admin-user-info">
          Signed in as: <strong>{session?.user.email || "Guest"}</strong> ({session?.user.role || "None"})
        </p>
        <Link href="/shop" className="button button-secondary">
          Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-console-wrapper">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`admin-toast ${feedback.type}`}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="admin-title-area">
          <div className="admin-badge">
            <ShieldCheck size={14} />
            <span>ADMINISTRATOR CONSOLE</span>
          </div>
          <h1>PRODUCT MANAGEMENT.</h1>
          <p>
            Manage authentic figurine catalogue, inventory stock levels, and Supabase Storage photographs.
          </p>
        </div>

        <button onClick={openCreate} className="button admin-create-btn">
          <Plus size={16} />
          <span>NEW PRODUCT</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="admin-toolbar">
        <form onSubmit={handleSearchSubmit} className="admin-search-form">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, character, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          <button type="submit" className="button button-sm">
            Search
          </button>
        </form>

        <div className="admin-filters">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
              if (session?.accessToken) loadData(session.accessToken);
            }}
            className="admin-select"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => session?.accessToken && loadData(session.accessToken)}
            className="button button-secondary button-sm"
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ITEM</th>
                <th>SKU</th>
                <th>CATEGORY</th>
                <th>PRICE (BDT)</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    No products found matching query.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const primaryImage =
                    prod.images.find((img) => img.isPrimary) || prod.images[0];
                  const stock = prod.inventory?.availableQuantity ?? 0;

                  return (
                    <tr key={prod.id} className={!prod.isActive ? "row-inactive" : ""}>
                      <td className="product-cell">
                        <div className="product-cell-thumb">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.imageUrl}
                              alt={primaryImage.altText || prod.name}
                              width={48}
                              height={48}
                              className="thumb-img"
                              unoptimized
                            />
                          ) : (
                            <div className="thumb-placeholder">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="product-cell-meta">
                          <Link href={`/products/${prod.slug}`} className="product-cell-name">
                            {prod.name}
                          </Link>
                          {prod.isFeatured && <span className="featured-pill">FEATURED</span>}
                        </div>
                      </td>
                      <td className="sku-cell">{prod.sku}</td>
                      <td>
                        <span className="category-pill">{prod.category?.name || "General"}</span>
                      </td>
                      <td className="price-cell">
                        <div className="price-stack">
                          <span className="curr-price">৳{prod.price.toLocaleString()}</span>
                          {prod.salePrice && (
                            <span className="sale-price">৳{prod.salePrice.toLocaleString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="stock-cell">
                        <button
                          onClick={() => {
                            setAdjustingStockProduct(prod);
                            setStockInput(prod.inventory?.quantity ?? 0);
                          }}
                          className={`stock-badge ${stock > 0 ? "in-stock" : "out-of-stock"}`}
                          title="Click to adjust stock"
                        >
                          <Boxes size={12} />
                          <span>{stock} in stock</span>
                        </button>
                      </td>
                      <td>
                        <span className={`status-pill ${prod.isActive ? "active" : "inactive"}`}>
                          {prod.isActive ? "ACTIVE" : "ARCHIVED"}
                        </span>
                      </td>
                      <td className="actions-cell text-right">
                        <div className="action-buttons">
                          <button
                            onClick={() => setManagingImagesProduct(prod)}
                            className="btn-action"
                            title="Manage Supabase Photographs"
                          >
                            <Upload size={14} />
                            <span>Images ({prod.images.length})</span>
                          </button>
                          <button
                            onClick={() => openEdit(prod)}
                            className="btn-action"
                            title="Edit details"
                          >
                            <Edit2 size={14} />
                          </button>
                          {prod.isActive && (
                            <button
                              onClick={() => handleArchive(prod)}
                              className="btn-action btn-danger"
                              title="Archive product"
                            >
                              <Trash2 size={14} />
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
        <div className="admin-pagination-bar">
          <p className="admin-count-label">
            Showing {products.length} of {totalCount} total products
          </p>
          <div className="pagination-controls">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                if (session?.accessToken) loadData(session.accessToken);
              }}
              disabled={page <= 1}
              className="button button-secondary button-sm"
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                if (session?.accessToken) loadData(session.accessToken);
              }}
              disabled={page >= totalPages}
              className="button button-secondary button-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isCreateModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <h2>{editingProduct ? "EDIT PRODUCT" : "NEW COLLECTIBLE STATUE"}</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="admin-form">
              <div className="form-grid-2">
                <div className="field">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      }));
                    }}
                    placeholder="e.g. Luffy · Gear Five"
                  />
                </div>

                <div className="field">
                  <label>Unique SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. HMT-OP-001"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="field">
                  <label>URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. straw-hat-captain"
                  />
                </div>

                <div className="field">
                  <label>Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="field">
                  <label>Price in BDT *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="6500"
                  />
                </div>

                <div className="field">
                  <label>Sale Price (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.salePrice || ""}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    placeholder="5900"
                  />
                </div>

                {!editingProduct && (
                  <div className="field">
                    <label>Initial Stock *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.initialStock}
                      onChange={(e) =>
                        setFormData({ ...formData, initialStock: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="field">
                <label>Short Description (Card Summary)</label>
                <input
                  type="text"
                  maxLength={500}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Luffy in Gear Five, seated with dynamic blue cloud effect pieces."
                />
              </div>

              <div className="field">
                <label>Full Curated Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe material composition, sculpting highlights, collector provenance..."
                />
              </div>

              <div className="admin-checkbox-row">
                <label className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active on Storefront</span>
                </label>

                <label className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>Featured Hero Selection</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button">
                  {editingProduct ? "SAVE CHANGES" : "CREATE PRODUCT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUST MODAL */}
      {adjustingStockProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card modal-sm">
            <div className="modal-header">
              <h2>INVENTORY ADJUSTMENT</h2>
              <button onClick={() => setAdjustingStockProduct(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStockAdjust} className="admin-form">
              <p className="modal-subtitle">
                Product: <strong>{adjustingStockProduct.name}</strong> ({adjustingStockProduct.sku})
              </p>
              <div className="field">
                <label>Total Available Units *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockInput}
                  onChange={(e) => setStockInput(Number(e.target.value))}
                />
                <span className="field-hint">
                  Reserved units for ongoing checkout: {adjustingStockProduct.inventory?.reservedQuantity || 0}
                </span>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setAdjustingStockProduct(null)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button">
                  CONFIRM STOCK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPABASE STORAGE IMAGE UPLOAD & GALLERY MODAL */}
      {managingImagesProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card modal-lg">
            <div className="modal-header">
              <div>
                <h2>SUPABASE PHOTOGRAPHS</h2>
                <p className="modal-subtitle">
                  Product: <strong>{managingImagesProduct.name}</strong> ({managingImagesProduct.sku})
                </p>
              </div>
              <button onClick={() => setManagingImagesProduct(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              className={`dropzone-box ${uploadingImages ? "uploading" : ""}`}
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
              <Upload size={32} className="dropzone-icon" />
              <h3>DRAG & DROP PHOTOGRAPHS HERE</h3>
              <p>Supports JPEG, PNG, WebP up to 10MB each. Uploads directly to Supabase Storage.</p>
              {uploadingImages && (
                <div className="upload-progress-pill">
                  <RefreshCw className="animate-spin" size={14} />
                  <span>Uploading to Supabase Storage bucket &apos;product-images&apos;...</span>
                </div>
              )}
              {uploadError && <p className="upload-error-text">{uploadError}</p>}
            </div>

            {/* Existing Images Gallery */}
            <div className="image-management-gallery">
              <h3>CATALOGUE PHOTOGRAPHS ({managingImagesProduct.images.length})</h3>

              {managingImagesProduct.images.length === 0 ? (
                <p className="no-images-text">No photographs uploaded yet for this figure.</p>
              ) : (
                <div className="admin-image-grid">
                  {managingImagesProduct.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`admin-image-card ${img.isPrimary ? "is-primary-card" : ""}`}
                    >
                      <div className="admin-image-thumb">
                        <Image
                          src={img.imageUrl}
                          alt={img.altText}
                          width={200}
                          height={200}
                          className="gallery-thumb-img"
                          unoptimized
                        />
                        {img.isPrimary && (
                          <div className="primary-pill">
                            <Star size={12} fill="#fff" />
                            <span>PRIMARY</span>
                          </div>
                        )}
                      </div>

                      <div className="image-card-footer">
                        <p className="image-order-tag">Order #{img.sortOrder + 1}</p>
                        <div className="image-card-buttons">
                          {!img.isPrimary && (
                            <button
                              onClick={() => handleSetPrimary(img.id)}
                              className="btn-icon"
                              title="Set as primary cover photograph"
                            >
                              <Star size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleMoveImage(idx, "up")}
                            disabled={idx === 0}
                            className="btn-icon"
                            title="Move up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMoveImage(idx, "down")}
                            disabled={idx === managingImagesProduct.images.length - 1}
                            className="btn-icon"
                            title="Move down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            className="btn-icon btn-danger"
                            title="Delete photograph"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setManagingImagesProduct(null)}
                className="button button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

