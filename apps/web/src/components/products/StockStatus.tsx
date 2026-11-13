import type { Product } from "@/lib/types";
import { CONCEPT_LABEL } from "@/lib/catalogue";

export function StockStatus({ product }: { product: Product }) {
  if (product.kind === "concept") return <p className="concept-disclosure">{CONCEPT_LABEL}</p>;
  if (product.kind === "reference") return <p className="availability">Ask about availability</p>;
  const available = product.availability === "in-stock";
  return <p className={`stock-status stock-status--${available ? "available" : product.availability === "pre-order" ? "preorder" : "unavailable"}`} role="status"><span className="stock-status-dot" aria-hidden="true" />{available ? "In stock" : product.availability === "pre-order" ? "Pre-order" : "Out of stock"}</p>;
}
