"use client";
import { useEffect } from "react";
import { useStore } from "../commerce/StoreProvider";
import { catalogue } from "@/lib/catalogue";
import { SectionHeading } from "../ui/Primitives";
import { ProductGrid } from "./ProductCard";
export function RecentlyViewed({ current }: { current: string }) {
  const { recent, markViewed } = useStore();
  useEffect(() => {
    markViewed(current);
  }, [current, markViewed]);
  const items = recent
    .filter((id) => id !== current)
    .map((id) => catalogue.find((p) => p.id === id)!)
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
