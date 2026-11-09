import type { CategoryDto } from "@himatu/shared";
import { fallbackCategories, categoryKind } from "@/lib/taxonomy";
import { CategoryGallery } from "./CategoryGallery";
export function CollectionGrid({ compact = false, exclude, categories }: { compact?: boolean; exclude?: string; categories?: CategoryDto[] }) {
  const entries = (categories || fallbackCategories).filter(category => categoryKind(category) === "FRANCHISE" && category.slug !== exclude);
  return <CategoryGallery categories={compact ? entries.slice(0,5) : entries} compact={compact} />;
}
