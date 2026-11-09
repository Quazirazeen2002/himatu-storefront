import { storefrontTaxonomy, type CategoryDto } from "@himatu/shared";
import type { Collection } from "./types";
export const fallbackCategories: CategoryDto[] = storefrontTaxonomy.map(category => ({ ...category, id: `preview-${category.slug}`, productCount: 0 }));
export const familyLabels = { ANIME: "Anime", MARVEL: "Marvel", DC: "DC", MOVIES: "Movies", OTHER: "Other collections" } as const;
export function asCollection(category: CategoryDto): Collection {
  return { slug: category.slug, name: category.name, caption: category.description || "Explore this collection.", color: "#737373", art: category.slug, imageUrl: category.imageUrl, imageIsDemo: category.imageIsDemo ?? false, family: category.family ?? "ANIME" };
}
export const categoryKind = (category: CategoryDto) => category.kind || "FRANCHISE";
export function categoryHref(category: CategoryDto) { return `/${categoryKind(category) === "PRODUCT_TYPE" ? "categories" : "collections"}/${category.slug}`; }
