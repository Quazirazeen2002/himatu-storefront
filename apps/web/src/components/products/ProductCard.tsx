import Link from "next/link";
import type { Product } from "@/lib/types";
import { CONCEPT_LABEL } from "@/lib/catalogue";
import { formatPrice } from "@/lib/config";
import { WishlistButton } from "../commerce/Commerce";
import { AssetImage } from "./AssetImage";
import { assets } from "@/lib/assets";
import { availabilityLabel } from "@/lib/config";
export function ProductCard({
  product: p,
  showCommerceMetadata = true,
}: {
  product: Product;
  showCommerceMetadata?: boolean;
}) {
  return (
    <article className="product-card">
      <div className="product-visual">
        <Link href={`/products/${p.id}`} aria-label={`View ${p.name}`}>
          <AssetImage asset={assets.product(p)} />
        </Link>
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
            {p.franchise} · Official Figurine
          </p>
        </div>
        {showCommerceMetadata && (
          <span className="price">
            {formatPrice(p.price || 0)}
          </span>
        )}
      </div>
      {showCommerceMetadata && (
        <p className="availability">
          In Stock · Ready for Delivery
        </p>
      )}
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
