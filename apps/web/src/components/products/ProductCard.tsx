"use client";
import { StockStatus } from "./StockStatus";
import { useStore } from "../commerce/StoreProvider";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Modal } from "../ui/Modal";
import { ProductActions } from "../commerce/ProductActions";
import { ProductEnquiry } from "./ProductEnquiry";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { CONCEPT_LABEL } from "@/lib/catalogue";
import { ProductPrice } from "./ProductPrice";
import { WishlistButton } from "../commerce/Commerce";
import { AssetImage } from "./AssetImage";
import { assets } from "@/lib/assets";
export function ProductCard({
  product,
  showCommerceMetadata = true,
}: {
  product: Product;
  showCommerceMetadata?: boolean;
}) {
  const store = useStore();
  const p = store.pricedCatalogue.find(item => item.id === product.id) || product;
  const [quickView, setQuickView] = useState(false);
  return (
    <article className={`product-card ${p.kind === "reference" ? "product-card--reference" : ""}`}>
      <div className="product-visual">
        <Link href={`/products/${p.id}`} aria-label={`View ${p.name}`}>
          <AssetImage asset={assets.product(p)} />
        </Link>
        <div className="product-wish">
          <WishlistButton id={p.id} />
        </div>
      </div>
      <button type="button" className="product-quick-view" onClick={() => setQuickView(true)} aria-label={`Quick view ${p.name}`}><Eye size={15} /> QUICK VIEW</button>
      <div className="product-caption">
        <div>
          <h3>
            <Link href={`/products/${p.id}`}>{p.name}</Link>
          </h3>
          <p>
            {p.franchise}
          </p>
        </div>
        {showCommerceMetadata && <ProductPrice product={p} />}
      </div>
      {showCommerceMetadata && <StockStatus product={p} />}
      {quickView && <Modal open={quickView} onClose={() => setQuickView(false)} title="Quick view" className="product-quick-modal"><div className="product-quick-layout"><AssetImage asset={assets.product(p)} /><div><p className="eyebrow">{p.franchise}</p><h3>{p.name}</h3><ProductPrice product={p} />{p.kind !== "concept" && <StockStatus product={p} />}{p.kind === "reference" ? <ProductEnquiry product={p} onAdded={() => setQuickView(false)} /> : p.kind !== "concept" ? <ProductActions product={p} onAdded={() => setQuickView(false)} /> : <p className="concept-disclosure">{CONCEPT_LABEL}</p>}<Link className="text-link" href={`/products/${p.id}`}>VIEW FULL DETAILS ↗</Link></div></div></Modal>}
    </article>
  );
}
export function ProductGrid({
  products,
  scroll = false,
  showCommerceMetadata = true,
}: {
  products: Product[];
  scroll?: boolean;
  showCommerceMetadata?: boolean;
}) {
  return (
    <div
      className={scroll ? "product-grid product-grid--scroll" : "product-grid"}
    >
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          showCommerceMetadata={showCommerceMetadata}
        />
      ))}
    </div>
  );
}
