import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Primitives";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { AssetImage } from "@/components/products/AssetImage";
import { assets } from "@/lib/assets";
import { asCollection, categoryKind } from "@/lib/taxonomy";
import { storefrontCategories } from "@/lib/server-categories";
export const dynamic = "force-dynamic";
export default async function ProductCategory({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = (await storefrontCategories()).find(category => category.slug === slug && categoryKind(category) === "PRODUCT_TYPE");
  if (!category) notFound();
  return <Container className="page-content"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/categories">Categories</Link> / {category.name}</nav><div className="taxonomy-hero"><div><p className="eyebrow">HIMATU / PRODUCT CATEGORIES</p><h1>{category.name.toUpperCase()}</h1><p>{category.description}</p>{category.imageIsDemo && <p className="taxonomy-disclosure">DEMO CATEGORY COVER · Illustrative artwork, not actual inventory.</p>}</div><AssetImage asset={assets.collection(asCollection(category))} priority /></div><ProductCatalog productCategory={category.slug} /></Container>;
}
