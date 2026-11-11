import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, SectionHeading } from "@/components/ui/Primitives";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { AssetImage } from "@/components/products/AssetImage";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { assets } from "@/lib/assets";
import { asCollection, categoryKind, familyLabels } from "@/lib/taxonomy";
import { storefrontCategories } from "@/lib/server-categories";
export const dynamic = "force-dynamic";
export default async function Collection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await storefrontCategories();
  const category = categories.find(category => category.slug === slug && categoryKind(category) === "FRANCHISE");
  if (!category) notFound();
  return <Container className="page-content"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/collections">Collections</Link> / {category.name}</nav><div className="taxonomy-hero"><div><p className="eyebrow">HIMATU / {familyLabels[category.family || "ANIME"]}</p><h1>{category.name.toUpperCase()}</h1><p>{category.description}</p>{category.imageIsDemo && <p className="taxonomy-disclosure">{slug === "other-collections" ? "AI-GENERATED CONCEPT — NOT FOR SALE" : "ILLUSTRATED COVER · Original illustrative artwork, not a product photograph."}</p>}</div><AssetImage asset={assets.collection(asCollection(category))} priority /></div><ProductCatalog collection={category.slug} /><section className="section"><SectionHeading title="More worlds to discover" /><CollectionGrid exclude={category.slug} compact categories={categories} /></section></Container>;
}
