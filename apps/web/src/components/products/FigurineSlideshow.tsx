"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight, ShoppingBag } from "lucide-react";
import { products as defaultProducts, formatPrice } from "@/lib/config";
import { AssetImage } from "./AssetImage";
import { assets } from "@/lib/assets";
import { useStore } from "../commerce/StoreProvider";
import type { Product } from "@/lib/types";

interface FigurineSlideshowProps {
  products?: Product[];
}

export function FigurineSlideshow({ products = defaultProducts }: FigurineSlideshowProps) {
  const store = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  // Number of items per viewport:
  // Mobile = 1, Tablet = 2, Desktop = 3
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, products.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // Auto-play slideshow every 4 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
    touchStart.current = null;
  };

  const slideWidthPct = 100 / itemsPerView;

  return (
    <div
      className="figurine-slideshow-wrap"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "10px 0 30px 0",
      }}
    >
      {/* Slides Track */}
      <div
        className="figurine-slideshow-track"
        style={{
          display: "flex",
          transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: `translateX(-${currentIndex * slideWidthPct}%)`,
          gap: "18px",
        }}
      >
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              flex: `0 0 calc(${slideWidthPct}% - 12px)`,
              minWidth: 0,
            }}
          >
            <article className="product-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div className="product-visual">
                <Link href={`/products/${p.id}`} aria-label={`View ${p.name}`}>
                  <AssetImage asset={assets.product(p)} sizes="(max-width:640px) 90vw, (max-width:1024px) 45vw, 30vw" />
                </Link>
              </div>

              <div className="product-caption" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 4px 0" }}>
                    <Link href={`/products/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                    {p.franchise} · Official Collectible
                  </p>
                </div>

                <div style={{ marginTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="price" style={{ fontSize: "16px", fontWeight: 800 }}>
                    {formatPrice(p.price || 0)}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      store.setQuantity(p.id, (store.bag[p.id] || 0) + 1);
                      store.setDrawer("bag");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#111111",
                      color: "#ffffff",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: 0,
                      cursor: "pointer",
                      transition: "transform 0.15s ease",
                    }}
                    className="hover:scale-95"
                    title={`Add ${p.name} to bag`}
                  >
                    <ShoppingBag size={13} />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous figurine"
        style={{
          position: "absolute",
          top: "40%",
          left: "10px",
          transform: "translateY(-50%)",
          background: "rgba(17, 17, 17, 0.85)",
          color: "#ffffff",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          cursor: "pointer",
          zIndex: 10,
          backdropFilter: "blur(4px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next figurine"
        style={{
          position: "absolute",
          top: "40%",
          right: "10px",
          transform: "translateY(-50%)",
          background: "rgba(17, 17, 17, 0.85)",
          color: "#ffffff",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          cursor: "pointer",
          zIndex: 10,
          backdropFilter: "blur(4px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <ChevronRight size={20} />
      </button>

      {/* Slide Indicators / Dots */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginTop: "20px",
        }}
      >
        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            style={{
              width: currentIndex === idx ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background: currentIndex === idx ? "var(--foreground, #111111)" : "var(--border, #d1d5db)",
              border: 0,
              cursor: "pointer",
              transition: "all 0.25s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
