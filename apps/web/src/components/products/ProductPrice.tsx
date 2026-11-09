"use client";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/config";
import { pricing } from "@/lib/pricing";
import { useStore } from "../commerce/StoreProvider";

export function ProductPrice({ product, detail = false }: { product: Product; detail?: boolean }) {
  const store = useStore();
  if (product.kind === "concept") return null;
  const price = pricing(store.pricedProducts.find(item => item.id === product.id) || product);
  return (
    <span className={`product-pricing ${detail ? "product-pricing--detail" : ""}`}>
      {price.discounted && <del aria-label={`Original price ${formatPrice(price.original)}`}>{formatPrice(price.original)}</del>}
      <strong className="price">{formatPrice(price.current)}</strong>
      {product.kind === "reference" && <span className="demo-price-label">Demo price</span>}
      {price.discounted && <span className="price-saving">Save {formatPrice(price.saving)}</span>}
    </span>
  );
}
