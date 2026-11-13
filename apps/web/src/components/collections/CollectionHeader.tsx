import type { CategoryDto } from "@himatu/shared";
import { AssetImage } from "../products/AssetImage";
import { assets } from "@/lib/assets";
import { asCollection, categoryKind } from "@/lib/taxonomy";
import { collectionBanner } from "@/lib/collection-banners";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
export function CollectionHeader({category,eyebrow,parentHref,parentLabel}:{category:CategoryDto;eyebrow:string;parentHref:string;parentLabel:string}) {
  const banner = collectionBanner(category);
  const asset = banner ? { ...assets.collection(asCollection(category)), src:banner.src, alt:banner.alt } : assets.collection(asCollection(category));
  return <header className={`collection-header collection-header--${category.slug} ${categoryKind(category) === "PRODUCT_TYPE" ? "collection-header--product-type" : ""}`}>
    <div className="collection-header-art"><AssetImage asset={{...asset,width:1600,height:900,fit:"contain"}} priority sizes="100vw" /></div>
    <nav className="collection-header-breadcrumbs" aria-label="Breadcrumb"><Link href={parentHref}>{parentLabel}</Link><span aria-hidden="true">/</span><span>{category.name}</span></nav>
    <div className="collection-header-copy"><p className="eyebrow">{eyebrow}</p><h1>{category.name}</h1><a className="collection-header-cta" href="#collection-products">Explore {category.name}</a><a className="collection-header-scroll" href="#collection-products" aria-label={`Scroll to ${category.name} products`}><ArrowDown size={20} aria-hidden="true" /></a></div>
    {banner?.source && banner.license && <small className="collection-header-credit">Image: <a href={banner.source} target="_blank" rel="noopener noreferrer">{banner.credit}</a> · <a href={banner.licenseUrl} target="_blank" rel="noopener noreferrer">{banner.license}</a> · resized</small>}
  </header>;
}
