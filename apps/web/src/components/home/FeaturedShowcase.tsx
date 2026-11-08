"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, ShoppingBag, Check } from "lucide-react";
import { useStore } from "../commerce/StoreProvider";
import { products } from "@/lib/config";
import { figurePhotos } from "@/lib/assets";
import { motion } from "framer-motion";
import { useState } from "react";

export function FeaturedShowcase() {
  const store = useStore();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    store.setQuantity(id, (store.bag[id] || 0) + 1);
    store.setDrawer("bag");
    setAddedId(id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const handleToggleWishlist = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    store.toggleWish(id);
  };

  // Select top featured items from actual catalogue
  const featuredItems = products.slice(0, 8);

  return (
    <section className="section-showcase" aria-labelledby="showcase-heading">
      <div className="showcase-header">
        <div>
          <span className="section-eyebrow">PREMIUM CURATION</span>
          <h2 id="showcase-heading" className="section-title">
            THE COLLECTION.
          </h2>
          <p className="section-subtitle">
            Authentic, high-grade statues and figures ready to elevate your shelf display.
          </p>
        </div>

        <Link href="/shop" className="btn-secondary-purple">
          <span>VIEW ALL COLLECTIBLES</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="showcase-grid">
        {featuredItems.map((product, index) => {
          const photo = figurePhotos[product.id];
          const isWishlisted = store.wishlist.includes(product.id);
          const isAdded = addedId === product.id;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (index % 4) * 0.1, ease: "easeOut" }}
            >
              <div className="collectible-card">
                <div className="collectible-badge-top">
                  <span className="badge-pill">IN STOCK</span>
                </div>

                <button
                  type="button"
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className="collectible-wishlist-btn"
                  onClick={(e) => handleToggleWishlist(e, product.id)}
                  style={isWishlisted ? { background: "#a855f7", borderColor: "#a855f7" } : undefined}
                >
                  <Heart size={16} fill={isWishlisted ? "#ffffff" : "none"} />
                </button>

                <Link href={`/products/${product.id}`} className="collectible-media">
                  {photo?.src ? (
                    <Image
                      src={photo.src}
                      alt={product.name}
                      width={400}
                      height={480}
                      quality={85}
                    />
                  ) : (
                    <div style={{ color: "var(--cinematic-muted)" }}>HIMATU Figure</div>
                  )}
                </Link>

                <div className="collectible-details">
                  <span className="collectible-category">
                    {product.character || "One Piece"}
                  </span>
                  <Link href={`/products/${product.id}`}>
                    <h3 className="collectible-title">{product.name}</h3>
                  </Link>

                  <div className="collectible-footer">
                    <span className="collectible-price">
                      ৳ {product.price.toLocaleString("en-BD")} BDT
                    </span>

                    <button
                      type="button"
                      className="collectible-add-btn"
                      onClick={(e) => handleAddToCart(e, product.id)}
                      style={isAdded ? { background: "#22c55e", borderColor: "#22c55e", color: "#ffffff" } : undefined}
                    >
                      {isAdded ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Check size={12} /> ADDED
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <ShoppingBag size={12} /> ADD TO BAG
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
