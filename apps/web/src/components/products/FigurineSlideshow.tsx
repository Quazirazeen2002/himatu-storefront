"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, Pause, Play } from "lucide-react";
import { products as defaultProducts } from "@/lib/config";
import { useStore } from "../commerce/StoreProvider";
import { ProductCard } from "./ProductCard";
import { ProductPrice } from "./ProductPrice";
import type { Product } from "@/lib/types";

const subscribe = (notify: () => void) => {
  window.addEventListener("resize", notify);
  return () => window.removeEventListener("resize", notify);
};
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const visibleCount = () => window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 4;

export function FigurineSlideshow({ products = defaultProducts }: { products?: Product[] }) {
  const store = useStore();
  products = store.pricedProducts.filter(p => p.isFeatured || products.some(item => item.id === p.id));
  const reduced = useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const touch = useRef<number | null>(null);
  const visible = useSyncExternalStore(subscribe, visibleCount, () => 4);
  const max = Math.max(0, products.length - visible);
  const current = Math.min(index, max);
  const step = (direction: number) => {
    setIndex((previous) => (Math.min(previous, max) + direction + max + 1) % (max + 1));

  };
  useEffect(() => {
    if (paused || hovered || !max || reduced) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setIndex(previous => previous >= max ? 0 : previous + 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, max, reduced]);

  return (
    <div className="featured-carousel" role="region" aria-label="Featured collectibles" aria-roledescription="carousel"
      onFocusCapture={() => setHovered(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false); }}
      onTouchStart={event => { touch.current = event.touches[0].clientX; }}
      onTouchEnd={event => { if (touch.current !== null) { const delta = touch.current - event.changedTouches[0].clientX; if (Math.abs(delta) > 45) step(delta > 0 ? 1 : -1); touch.current = null; } }}>
      <div className="featured-carousel-window">
        <div className="featured-carousel-track" style={{ transform: `translateX(calc(-${current} * ((100% + 24px) / ${visible})))` }}>
          {products.map((product, position) => (
            <div className="featured-carousel-item" key={product.id} style={{ flexBasis: `calc((100% - ${(visible - 1) * 24}px) / ${visible})` }} inert={position < current || position >= current + visible ? true : undefined}>
              <ProductCard product={product} showCommerceMetadata={false} />
              <div className="featured-buy-row">
                <ProductPrice product={product} />
                {product.kind !== "concept" && product.kind !== "reference" && <button className="featured-add" type="button" disabled={product.availability === "sold-out" || (store.bag[product.id] || 0) >= 10}
                  onClick={() => { store.setQuantity(product.id, (store.bag[product.id] || 0) + 1); store.setDrawer("bag"); }}>
                  <ShoppingBag size={16} />{product.availability === "sold-out" ? "Sold out" : "Add to bag"}
                </button>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="featured-carousel-controls">
        <p className="eyebrow">{products.length ? current + 1 : 0}–{Math.min(current + visible, products.length)} / {products.length}</p>
        <div>
          <button type="button" aria-label="Previous figurine" disabled={!max} onClick={() => step(-1)}><ChevronLeft size={20} /></button>
          <button type="button" aria-label="Next figurine" disabled={!max} onClick={() => step(1)}><ChevronRight size={20} /></button>
          {!reduced && <button className="featured-play" type="button" aria-label={paused ? "Play featured slideshow" : "Pause featured slideshow"} onClick={() => { setPaused(!paused); if (paused) setHovered(false); }}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
        </div>
      </div>
    </div>
  );
}
