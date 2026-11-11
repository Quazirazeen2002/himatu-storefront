"use client";
import { useEffect } from "react";
import { useStore } from "../commerce/StoreProvider";
import { SectionHeading } from "../ui/Primitives";
import { ProductGrid } from "./ProductCard";
export function RecentlyViewed({ current }: { current: string }) {
  const { recent, markViewed, pricedCatalogue } = useStore();
  useEffect(() => {
    markViewed(current);
  }, [current, markViewed]);
  const items = recent
    .filter((id) => id !== current)
    .map((id) => pricedCatalogue.find((p) => p.id === id)!)
    .filter(Boolean)
    .slice(0, 4);
  if (!items.length) return null;
  return (
    <section className="section">
      <SectionHeading
        title="Recently in your world"
        eyebrow="YOUR RECENTLY VIEWED FIGURES"
      />
      <ProductGrid products={items} />
    </section>
  );
}
