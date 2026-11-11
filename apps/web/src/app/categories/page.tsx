import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { CategoryGallery, CollectionFamilyGallery } from "@/components/collections/CategoryGallery";
import { storefrontCategories } from "@/lib/server-categories";
import { categoryKind } from "@/lib/taxonomy";
export const dynamic = "force-dynamic";
export const metadata = { title: "Shop by category" };
export default async function Categories() {
  const all = await storefrontCategories();
  const categories = all.filter(category => categoryKind(category) === "PRODUCT_TYPE");
  return <Container className="page-content"><div className="page-intro"><p className="eyebrow">YOUR FANDOM, IN EVERY FORM</p><h1>SHOP BY<br />CATEGORY.</h1><p>Explore Action Figures, Keychains, Katanas, T-shirts and accessories. Choose a product category here, then narrow your search by franchise.</p></div><CategoryGallery categories={categories} /><section className="section"><div className="section-heading"><h2>Find your world.</h2><Link href="/collections?family=ALL" className="text-link">All collections</Link></div><CollectionFamilyGallery categories={all} /></section></Container>;
}
