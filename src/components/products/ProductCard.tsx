import Link from "next/link";
import type { Product } from "@/lib/types";
import { CONCEPT_LABEL } from "@/lib/catalogue";
import { formatPrice } from "@/lib/config";
import { WishlistButton } from "../commerce/Commerce";
import { AssetImage } from "./AssetImage";
import { assets } from "@/lib/assets";
import { availabilityLabel } from "@/lib/config";
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="product-card">
      <div className="product-visual">
        <Link href={`/products/${p.id}`} aria-label={`View ${p.name}`}>
          <AssetImage asset={assets.product(p)} />
        </Link>
        {p.kind === "concept" && (
          <span className="concept-badge">AI CONCEPT</span>
        )}
        <div className="product-wish">
          <WishlistButton id={p.id} />
        </div>
      </div>
      <div className="product-caption">
        <div>
          <h3>
            <Link href={`/products/${p.id}`}>{p.name}</Link>
          </h3>
          <p>
            {p.franchise} ·{" "}
            {p.kind === "concept" ? "Visual exploration" : "Figure"}
          </p>
        </div>
        {p.kind !== "concept" && (
          <span className="price">
            {formatPrice(p.price)}
            <small>Sample price</small>
          </span>
        )}
      </div>
      <p className="availability">
        {p.kind === "concept"
          ? CONCEPT_LABEL
          : `Demo ${availabilityLabel[p.availability]} · Not verified stock`}
      </p>
    </article>
  );
}
export function ProductGrid({
  products,
  scroll = false,
}: {
  products: Product[];
  scroll?: boolean;
}) {
  return (
    <div
      className={scroll ? "product-grid product-grid--scroll" : "product-grid"}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
