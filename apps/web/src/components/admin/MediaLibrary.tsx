"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Search,
  ExternalLink,
  Copy,
  Check,
  Star,
  Package,
} from "lucide-react";
import { authService, CustomerSession } from "@/lib/auth-service";
import { getAdminProducts } from "@/lib/commerce-api";
import type { ProductDto, ProductImageDto } from "@himatu/shared";

interface FlatImage extends ProductImageDto {
  productName: string;
  productSku: string;
  productId: string;
}

export function MediaLibrary() {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<FlatImage[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<FlatImage | null>(null);

  useEffect(() => {
    authService.getSession().then(async (s) => {
      setSession(s);
      if (s?.accessToken && s.user.role === "ADMIN") {
        try {
          const prods = await getAdminProducts(s.accessToken, { limit: 100 });
          const flatList: FlatImage[] = [];
          const items = Array.isArray(prods?.items) ? prods.items : [];
          for (const p of items) {
            for (const img of p.images || []) {
              flatList.push({
                ...img,
                productName: p.name,
                productSku: p.sku,
                productId: p.id,
              });
            }
          }
          setImages(flatList);
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filtered = images.filter((img) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      img.productName.toLowerCase().includes(term) ||
      img.productSku.toLowerCase().includes(term) ||
      (img.altText || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <p style={{ padding: "40px", fontWeight: 700 }}>LOADING SUPABASE MEDIA ASSETS…</p>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Product Media Library</h1>
          <p>Authentic figurine photography stored in dedicated Supabase Storage bucket (product-images).</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="admin-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700 }}>
            {filtered.length} Authenticated Product Assets
          </span>

          <div style={{ width: "280px" }}>
            <input
              type="search"
              placeholder="Search by figure, SKU, alt text…"
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

      {/* Images Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {filtered.map((img) => (
          <div
            key={img.id}
            className="admin-card"
            style={{ padding: "12px", margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                position: "relative",
                aspectRatio: "3/4",
                background: "#000000",
                borderRadius: "4px",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => setPreviewImage(img)}
            >
              <img
                src={img.imageUrl}
                alt={img.altText || img.productName}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              {img.isPrimary && (
                <span
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    background: "var(--admin-accent)",
                    color: "#ffffff",
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "3px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <Star size={10} />
                  <span>PRIMARY</span>
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {img.productName}
              </div>
              <div style={{ fontSize: "11px", color: "var(--admin-muted)", fontFamily: "var(--font-metadata, monospace)" }}>
                {img.productSku}
              </div>
              {img.altText && (
                <div style={{ fontSize: "11px", color: "var(--admin-muted)", marginTop: "4px", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  "{img.altText}"
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "6px", borderTop: "1px solid var(--admin-border-subtle)", paddingTop: "8px" }}>
              <button
                type="button"
                className="admin-btn admin-btn--secondary"
                style={{ flex: 1, height: "30px", fontSize: "11px", padding: "0 6px" }}
                onClick={() => handleCopy(img.imageUrl, img.id)}
              >
                {copiedId === img.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span>{copiedId === img.id ? "Copied" : "Copy URL"}</span>
              </button>
              <Link
                href="/admin/products"
                className="admin-btn admin-btn--secondary"
                style={{ height: "30px", fontSize: "11px", padding: "0 8px" }}
                title="Manage product"
              >
                <Package size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div className="admin-modal-card" style={{ maxWidth: "600px", background: "#000000" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", color: "#ffffff", borderBottom: "1px solid #222222" }}>
              <span style={{ fontWeight: 700, fontSize: "13px" }}>{previewImage.productName}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{ background: "transparent", border: 0, color: "#ffffff", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
              <img
                src={previewImage.imageUrl}
                alt={previewImage.altText || previewImage.productName}
                style={{ maxHeight: "70vh", maxWidth: "100%", objectFit: "contain" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

