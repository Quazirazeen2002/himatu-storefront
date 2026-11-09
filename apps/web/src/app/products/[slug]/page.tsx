import Link from "next/link";
import { ProductEnquiry } from "@/components/products/ProductEnquiry";
import { catalogue, concepts, CONCEPT_LABEL } from "@/lib/catalogue";
import { WishlistButton } from "@/components/commerce/Commerce";
import { notFound, redirect } from "next/navigation";
import {
  availabilityLabel,
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
  const p = [...catalogue, ...concepts].find((p) => p.id === slug);
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
          <p className="product-story-lead">{p.description}</p>
          <p className="product-status">
            {p.kind === "concept"
              ? "Original fictional character"
              : p.kind === "reference" ? "Enquire for availability" : availabilityLabel[p.availability]}{" "}
            · {p.type}
          </p>
          <dl className="product-character"><dt>THE CHARACTER</dt><dd>{p.character}</dd></dl>
          <details className="product-provenance"><summary>Photography & product information</summary><p>{p.kind === "reference" ? `Original product photograph sourced from ${p.source.label}. This reference listing does not confirm HIMATU stock or price.` : p.photoSource ? `Original product photograph from ${p.photoSource.label}. Contact HIMATU to confirm the exact item and availability.` : p.kind === "concept" ? "AI-generated visual concept; not for sale." : "Photographed by HIMATU. Ask our team to confirm the current specifications, manufacturer, authenticity and availability before ordering."}</p></details>
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
          <details open>
            <summary>About this figure</summary>
            <p>
              {p.kind === "concept"
                ? "Original AI-generated character exploration. The illustrated finish and display base do not describe a manufactured product."
                : p.kind === "reference" || p.photoSource ? "Explore the original source photographs above. Contact HIMATU to discuss the exact edition and confirm whether it can be supplied." : "A character worth making room for. Explore the pose, sculpted details and display composition in the original HIMATU photograph. Material, dimensions and packaging information will be added when confirmed."}
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
