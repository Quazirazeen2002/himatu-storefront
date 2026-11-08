import Link from "next/link";
import { CONCEPT_LABEL } from "@/lib/catalogue";
import { ArrowUpRight } from "lucide-react";
import { collections } from "@/lib/config";
import { AssetImage } from "../products/AssetImage";
import { assets } from "@/lib/assets";
export function CollectionGrid({
  compact = false,
  exclude,
}: {
  compact?: boolean;
  exclude?: string;
}) {
  return (
    <div
      className={`collection-grid ${compact ? "collection-grid--compact" : ""}`}
    >
      {collections
        .filter((c) => c.slug !== exclude)
        .slice(0, compact ? 5 : 6)
        .map((c) => (
          <Link
            className="collection-card"
            key={c.slug}
            href={`/collections/${c.slug}`}
            style={{ "--collection-color": c.color } as React.CSSProperties}
          >
            <div className="collection-visual">
              <span className="collection-monogram" aria-hidden="true">
                {c.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </span>
              <AssetImage asset={assets.collection(c)} />
              {c.slug === "other-collections" && (
                <span className="concept-badge">AI CONCEPT</span>
              )}
            </div>
            <div className="collection-caption">
              <h3>{c.name}</h3>
              <ArrowUpRight size={20} />
            </div>
            {!compact && (
              <p>
                {c.slug === "other-collections" ? CONCEPT_LABEL : c.caption}
              </p>
            )}
          </Link>
        ))}
    </div>
  );
}
