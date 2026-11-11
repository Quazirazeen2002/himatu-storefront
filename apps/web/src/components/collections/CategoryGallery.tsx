import Link from "next/link";
import type { CategoryDto } from "@himatu/shared";
import { ArrowUpRight } from "lucide-react";
import { AssetImage } from "../products/AssetImage";
import { assets } from "@/lib/assets";
import { asCollection, categoryHref } from "@/lib/taxonomy";

export function CategoryGallery({ categories, compact = false }: { categories: CategoryDto[]; compact?: boolean }) {
  return <div className={`taxonomy-grid ${compact ? "taxonomy-grid--compact" : ""}`}>
    {categories.map(category => <Link className="taxonomy-card" key={category.slug} href={categoryHref(category)}>
      <div className="taxonomy-image"><AssetImage asset={assets.collection(asCollection(category))} sizes={compact ? "(max-width:767px) 45vw, 20vw" : "(max-width:767px) 45vw, 30vw"} />
        {category.imageIsDemo && <span className="taxonomy-demo-label">ILLUSTRATED COVER</span>}
      </div>
      <div className="taxonomy-card-heading"><h3>{category.name}</h3><ArrowUpRight size={18} /></div>
      <p>{category.description}</p>
      {category.imageIsDemo && <small>Illustrative cover · not actual inventory</small>}
    </Link>)}
  </div>;
}

export function CollectionFamilyGallery({ categories }: { categories: CategoryDto[] }) {
  const families = [["ANIME", "Anime"], ["MARVEL", "Marvel"], ["DC", "DC"], ["MOVIES", "Movies"]] as const;
  return <div className="taxonomy-grid taxonomy-grid--families">{families.map(([family,name]) => {
    const members=categories.filter(category=>category.kind !== "PRODUCT_TYPE" && category.family === family);
    const cover=members[0]; if(!cover)return null;
    return <Link className="taxonomy-card" href={`/collections?family=${family}`} key={family}>
      <div className="taxonomy-image"><AssetImage asset={assets.collection(asCollection(cover))} />{cover.imageIsDemo && <span className="taxonomy-demo-label">ILLUSTRATED COVER</span>}</div>
      <div className="taxonomy-card-heading"><h3>{name}</h3><ArrowUpRight size={18} /></div>
      <p>{members.length} {members.length === 1 ? "collection" : "collections"} to explore</p>
    </Link>;
  })}</div>;
}
