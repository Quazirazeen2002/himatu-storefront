"use client";
import { useStore } from "../commerce/StoreProvider";
import { CategoryGallery } from "./CategoryGallery";
import { categoryKind } from "@/lib/taxonomy";
import { SectionHeading } from "../ui/Primitives";
export function CategoryShowcase() {
  const { categoryRegistry } = useStore();
  const categories = categoryRegistry.filter(category => categoryKind(category) === "PRODUCT_TYPE");
  if (!categories.length) return null;
  return <section className="section category-showcase"><SectionHeading eyebrow="FIND YOUR KIND OF FANDOM" title="Shop by category" href="/categories" action="All categories" /><CategoryGallery categories={categories} compact /></section>;
}
