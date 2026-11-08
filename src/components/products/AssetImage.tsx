"use client";
import Image from "next/image";
import { useState } from "react";
import type { ImageAsset } from "@/lib/assets";

export function AssetImage({
  asset,
  priority = false,
  sizes = "(max-width:767px) 80vw, 30vw",
}: {
  asset: ImageAsset;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`asset-image ${asset.src ? "asset-image--photo" : "asset-image--pending"}`}
      style={{ aspectRatio: `${asset.width}/${asset.height}` }}
    >
      {asset.src && !failed ? (
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          style={{ objectFit: asset.fit || "contain" }}
        />
      ) : (
        <div
          role="img"
          aria-label={asset.src ? "Photograph unavailable" : asset.alt}
          className="asset-pending"
        >
          <span aria-hidden="true">H</span>
          <p>
            {asset.src ? "Photograph unavailable" : "Photography coming soon"}
          </p>
        </div>
      )}
      {failed && <span className="asset-error">Photograph unavailable</span>}
    </div>
  );
}
