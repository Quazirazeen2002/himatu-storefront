"use client";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { Product } from "@/lib/types";
import { assets } from "@/lib/assets";
import { AssetImage } from "./AssetImage";
import { IconButton } from "../ui/Primitives";
import { Modal } from "../ui/Modal";
export function ProductGallery({ product }: { product: Product }) {
  const images = assets.gallery(product);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touch = useRef<number | null>(null);
  const move = (direction: number) =>
    setIndex(
      (current) => (current + direction + images.length) % images.length,
    );
  return (
    <div className="product-gallery">
      <div
        className="gallery-main"
        onTouchStart={(e) => {
          touch.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touch.current !== null) {
            const delta = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
            touch.current = null;
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
        }}
        tabIndex={0}
        role="region"
        aria-label="Product image gallery. Use arrow keys to change view."
      >
        <AssetImage
          key={images[index].id}
          asset={images[index]}
          priority
          sizes="(max-width:767px) 100vw, 55vw"
        />
        <div className="gallery-top">
          <span>
            {product.kind === "concept"
              ? "AI-GENERATED CONCEPT"
              : (product.kind === "reference" || product.photoSource) ? "SOURCE PRODUCT PHOTOGRAPH" : "HIMATU PHOTOGRAPHY"}
          </span>
          <IconButton label="Zoom product image" onClick={() => setZoom(true)}>
            <ZoomIn size={20} />
          </IconButton>
        </div>
        <div className="gallery-bottom">
          <IconButton
            disabled={images.length < 2}
            label="Previous product image"
            onClick={() => move(-1)}
          >
            <ChevronLeft />
          </IconButton>
          <span role="status">
            {index + 1} / {images.length} ·{" "}
            {product.kind === "concept" ? "AI concept" : "Original photograph"}
          </span>
          <IconButton
            disabled={images.length < 2}
            label="Next product image"
            onClick={() => move(1)}
          >
            <ChevronRight />
          </IconButton>
        </div>
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbnails" aria-label="Product image views">
          {images.map((asset, i) => (
            <button
              key={asset.id}
              aria-label={`View photograph ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
            >
              <AssetImage asset={asset} sizes="100px" />
            </button>
          ))}
        </div>
      )}
      <p className="demo-note">
        {product.kind === "concept" ? "Original character exploration · AI-generated concept, not for sale" : (product.kind === "reference" || product.photoSource) ? "Original source product photography · Ask HIMATU about availability" : "The details. The character. Your next focal point. · HIMATU photography"}
      </p>
      <Modal
        open={zoom}
        onClose={() => setZoom(false)}
        title="Product image zoom"
        className="zoom-modal"
      >
        <div className="zoom-image">
          <AssetImage asset={images[index]} sizes="90vw" />
        </div>
        <div className="gallery-bottom">
          <IconButton
            disabled={images.length < 2}
            label="Previous zoom image"
            onClick={() => move(-1)}
          >
            <ChevronLeft />
          </IconButton>
          <span>
            {index + 1} / {images.length}
          </span>
          <IconButton
            disabled={images.length < 2}
            label="Next zoom image"
            onClick={() => move(1)}
          >
            <ChevronRight />
          </IconButton>
        </div>
      </Modal>
    </div>
  );
}
