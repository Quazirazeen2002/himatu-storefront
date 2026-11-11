import Link from "next/link";
import { getProductBySlug, CommerceApiError } from "@/lib/commerce-api";
import { toStorefrontProduct } from "@/lib/storefront-products";
import type { Product } from "@/lib/types";
import { StockStatus } from "@/components/products/StockStatus";
export const dynamic = "force-dynamic";
import { ProductEnquiry } from "@/components/products/ProductEnquiry";
import { catalogue, concepts, CONCEPT_LABEL } from "@/lib/catalogue";
import { WishlistButton } from "@/components/commerce/Commerce";
import { notFound, redirect } from "next/navigation";
import {
  retiredProductCollections,
} from "@/lib/config";
import { ProductPrice } from "@/components/products/ProductPrice";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductActions } from "@/components/commerce/ProductActions";
import { RecentlyViewed } from "@/components/products/RecentlyViewed";

import {
  Container,
  SectionHeading,
} from "@/components/ui/Primitives";
import { ProductGrid } from "@/components/products/ProductCard";
export function generateStaticParams() {
  return [...catalogue, ...concepts].map((p) => ({ slug: p.id }));
}
export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let p: Product | undefined = [...catalogue, ...concepts].find((p) => p.id === slug);
  try {
    p = toStorefrontProduct(await getProductBySlug(slug));
  } catch (error) {
    // A deliberate archive/404 must not resurrect a legacy figure.
    if (error instanceof CommerceApiError && error.status === 404 && p?.kind !== "reference" && p?.kind !== "concept") p = undefined;
    if (!p && !(error instanceof CommerceApiError && error.status === 404)) throw error;
  }
  if (!p) {
    if (retiredProductCollections[slug])
      redirect(`/collections/${retiredProductCollections[slug]}`);
    notFound();
  }
  return (
    <Container className="page-content">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <Link href="/shop">Shop</Link> /{" "}
        <Link href={`/collections/${p.collection}`}>{p.franchise}</Link> /{" "}
        {p.name}
      </nav>
      <div className="product-detail">
        <ProductGallery product={p} />
        <div className="detail-copy">
          <p className="eyebrow">{p.franchise} / {p.type.toUpperCase()}</p>
          <h1>{p.name.toUpperCase()}</h1>
          {p.kind !== "concept" ? (
            <div className="detail-price"><ProductPrice product={p} detail /></div>
          ) : (
            <p className="concept-disclosure">{CONCEPT_LABEL}</p>
          )}
          <StockStatus product={p} />
          <dl className="product-character"><dt>THE CHARACTER</dt><dd>{p.character}</dd></dl>
          {p.specifications &&
            Object.values(p.specifications).some(Boolean) && (
              <dl className="product-specifications">
                {Object.entries(p.specifications)
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
              </dl>
            )}
          {p.kind === "reference" ? <ProductEnquiry product={p} /> : p.kind === "concept" ? (
            <div className="concept-actions">
              <p>
                This visual exploration cannot be purchased or added to the bag.
              </p>
              <WishlistButton id={p.id} />
            </div>
          ) : (
            <ProductActions product={p} />
          )}
        </div>
      </div>
      <section className="section">
        <SectionHeading title="Keep exploring" href="/shop" />
        <ProductGrid
          products={catalogue.filter((item) => item.id !== p.id).slice(0, 3)}
        />
      </section>
      <RecentlyViewed current={p.id} />
    </Container>
  );
}
