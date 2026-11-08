import Link from "next/link";
import { catalogue, CONCEPT_LABEL } from "@/lib/catalogue";
import { WishlistButton } from "@/components/commerce/Commerce";
import { notFound, redirect } from "next/navigation";
import {
  formatPrice,
  availabilityLabel,
  retiredProductCollections,
} from "@/lib/config";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductActions } from "@/components/commerce/ProductActions";
import { RecentlyViewed } from "@/components/products/RecentlyViewed";

import {
  Container,
  DemoNotice,
  SectionHeading,
} from "@/components/ui/Primitives";
import { ProductGrid } from "@/components/products/ProductCard";
export function generateStaticParams() {
  return catalogue.map((p) => ({ slug: p.id }));
}
export default async function ProductDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = catalogue.find((p) => p.id === slug);
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
          <p className="eyebrow">{p.franchise} / FIGURE</p>
          <h1>{p.name.toUpperCase()}</h1>
          {p.kind !== "concept" ? (
            <p className="detail-price">
              {formatPrice(p.price)}
              <span>Illustrative price</span>
            </p>
          ) : (
            <p className="concept-disclosure">{CONCEPT_LABEL}</p>
          )}
          <p>{p.description}</p>
          <p className="product-status">
            {p.kind === "concept"
              ? "Original fictional character"
              : `Demo ${availabilityLabel[p.availability]}`}{" "}
            · {p.type}
          </p>
          <p>Character: {p.character}</p>{" "}
          <DemoNotice>
            {p.kind === "concept"
              ? "AI-generated visual concept only. No actual inventory, price, availability or specifications are claimed."
              : "HIMATU product photograph. Availability, specifications, manufacturer, authenticity and pricing have not been confirmed."}
          </DemoNotice>
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
          {p.kind === "concept" ? (
            <div className="concept-actions">
              <p>
                This visual exploration cannot be purchased or added to the bag.
              </p>
              <WishlistButton id={p.id} />
            </div>
          ) : (
            <ProductActions product={p} />
          )}
          <details open>
            <summary>About this figure</summary>
            <p>
              {p.kind === "concept"
                ? "Original AI-generated character exploration. The illustrated finish and display base do not describe a manufactured product."
                : "Original HIMATU photograph. Material, dimensions, manufacturer and packaging details are unverified and will be supplied before launch."}
            </p>
          </details>
          <details>
            <summary>Delivery & returns</summary>
            <p>
              Approved shipping and return information will be published before
              purchases are enabled.
            </p>
          </details>
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
