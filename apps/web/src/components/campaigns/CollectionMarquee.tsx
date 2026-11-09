"use client";

import Link from "next/link";
import { Pause, Play, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useStore } from "../commerce/StoreProvider";
import { categoryKind, asCollection } from "@/lib/taxonomy";

export function CollectionMarquee() {
  const [paused, setPaused] = useState(false);
  const { categoryRegistry } = useStore();
  const collections = categoryRegistry.filter(category => categoryKind(category) === "FRANCHISE").map(asCollection);
  if (!collections.length) return null;
  return (
    <section className={`collection-marquee ${paused ? "is-paused" : ""}`} aria-label="Explore anime collections">
      <div className="marquee-window">
        <div className="marquee-track" style={{ animationDuration: `${collections.length * 7}s` }}>
          {[0, 1].map((copy) => (
            <div className="marquee-group" key={copy} aria-hidden={copy === 1 ? true : undefined} inert={copy === 1 ? true : undefined}>
              {collections.map((collection) => (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} tabIndex={copy === 1 ? -1 : undefined}>
                  <span className="marquee-marker" aria-hidden="true" />{collection.name}<ArrowUpRight aria-hidden="true" size={22} />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button className="marquee-toggle" type="button" aria-label={paused ? "Play collection marquee" : "Pause collection marquee"} onClick={() => setPaused(!paused)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
    </section>
  );
}
