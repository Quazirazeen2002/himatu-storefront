import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Primitives";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { CollectionHeader } from "@/components/collections/CollectionHeader";
import { categoryKind } from "@/lib/taxonomy";
import { storefrontCategories } from "@/lib/server-categories";
export const dynamic = "force-dynamic";
export default async function ProductCategory({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = (await storefrontCategories()).find(category => category.slug === slug && categoryKind(category) === "PRODUCT_TYPE");
  if (!category) notFound();
  return <><CollectionHeader category={category} eyebrow={"HIMATU / PRODUCT CATEGORIES"} parentHref="/categories" parentLabel="Categories" /><Container className="page-content"><section id="collection-products" className="collection-products"><ProductCatalog productCategory={category.slug} /></section></Container></>;
}
