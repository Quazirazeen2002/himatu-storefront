import type { CategoryDto } from "@himatu/shared";

type Banner = { src: string; alt: string; credit?: string; source?: string; license?: string; licenseUrl?: string };

// Editorial banner defaults are independent of the category card cover.
const banners: Record<string, Banner> = {
  "action-figures": { src:"/images/collections/action-figures-shelf.jpeg", alt:"A full shelf of action figures in the photograph supplied by HIMATU" },
  bleach: { src:"/images/collections/bleach-wallpaper.webp", alt:"Illustrated Bleach characters with Ichigo Kurosaki in the foreground" },
  "hunter-x-hunter": { src:"/images/collections/hunter-x-hunter-wallpaper.webp", alt:"Gon and Killua beneath a star-filled night sky" },
  "death-note": { src:"/images/collections/death-note-wallpaper.webp", alt:"Illustrated Light Yagami and Ryuk facing each other" },
  marvel: { src:"/images/collections/marvel-wallpaper.webp", alt:"Illustrated Marvel heroes assembled around Spider-Man" },
  dc: { src:"/images/collections/dc-wallpaper.webp", alt:"Illustrated DC heroes including Superman, Batman and Wonder Woman" },
  movies: { src:"/images/collections/movies-wallpaper.webp", alt:"Anime film artwork showing a comet crossing the night sky" },
  "other-collections": { src:"/images/collections/other-collections-wallpaper.webp", alt:"Illustrated collage of anime characters from several series" },
  "solo-leveling": { src:"/images/collections/solo-leveling-banner.webp", alt:"Solo Leveling official anime promotional artwork", credit:"Solo Leveling anime official site", source:"https://sololeveling-anime.net/assets/img/top/visual3.jpg" },
};

export function collectionBanner(category: CategoryDto): Banner | null {
  const fallback = banners[category.slug];
  const src = category.bannerImageUrl || fallback?.src || category.imageUrl;
  if (!src) return null;
  return fallback?.src === src ? fallback : { src, alt: `${category.name} collection banner` };
}
