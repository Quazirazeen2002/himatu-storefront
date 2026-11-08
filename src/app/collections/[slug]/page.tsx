import { CONCEPT_LABEL } from "@/lib/catalogue";
import { notFound } from "next/navigation";
import { collections, products } from "@/lib/config";
import { Container } from "@/components/ui/Primitives";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { AssetImage } from "@/components/products/AssetImage";
import { assets } from "@/lib/assets";
import { SectionHeading } from "@/components/ui/Primitives";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { ProductGrid } from "@/components/products/ProductCard";
export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}
export default async function Collection({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = collections.find((c) => c.slug === slug);
  if (!c) notFound();
  return (
    <Container>
      <div className="collection-hero">
        <div>
          <p className="eyebrow">THE HIMATU UNIVERSES</p>
          <h1>{c.name.toUpperCase()}</h1>
          <p>{c.caption}</p>
        </div>
        <div className="collection-hero-image">
          <AssetImage asset={assets.collection(c)} priority />
        </div>
        <span className="art-label">
          {c.slug === "one-piece"
            ? "HIMATU PHOTOGRAPHY"
            : c.slug === "other-collections"
              ? CONCEPT_LABEL
              : "PHOTOGRAPHY COMING SOON"}
        </span>
      </div>
      <p className="collection-introduction">
        {c.slug === "other-collections" ? (
          "Explore original AI-generated visual concepts. These fictional designs are not actual inventory and are not for sale."
        ) : (
          <>
            Explore {c.name} through the HIMATU collection. Photographs are
            supplied by HIMATU; prices and availability remain demonstrations.
          </>
        )}
      </p>
      {products.some((p) => p.collection === c.slug) && (
        <section className="collection-feature">
          <SectionHeading title="In this universe" />
          <ProductGrid
            products={products
              .filter((p) => p.collection === c.slug)
              .slice(0, 2)}
          />
        </section>
      )}
      <SectionHeading title="Explore the collection" />
      <ProductCatalog collection={c.slug} />
      <section className="section">
        <SectionHeading title="More worlds to discover" />
        <CollectionGrid exclude={c.slug} />
      </section>
    </Container>
  );
}
