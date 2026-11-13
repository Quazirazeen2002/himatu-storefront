import { notFound } from "next/navigation";
import { Container, SectionHeading } from "@/components/ui/Primitives";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { CollectionHeader } from "@/components/collections/CollectionHeader";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { categoryKind, familyLabels } from "@/lib/taxonomy";
import { storefrontCategories } from "@/lib/server-categories";
export const dynamic = "force-dynamic";
export default async function Collection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await storefrontCategories();
  const category = categories.find(category => category.slug === slug && categoryKind(category) === "FRANCHISE");
  if (!category) notFound();
  return <><CollectionHeader category={category} eyebrow={`HIMATU / ${familyLabels[category.family || "ANIME"]}`} parentHref="/collections" parentLabel="Collections" /><Container className="page-content"><section id="collection-products" className="collection-products"><ProductCatalog collection={category.slug} /></section><section className="section"><SectionHeading title="More worlds to discover" /><CollectionGrid exclude={category.slug} compact categories={categories} /></section></Container></>;
}
