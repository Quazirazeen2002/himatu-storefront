import { collectionBanner } from "../src/lib/collection-banners";
import type { CategoryDto } from "@himatu/shared";

const category = (changes: Partial<CategoryDto>): CategoryDto => ({
  id: "category", name: "Action Figures", slug: "action-figures",
  description: null, imageUrl: "/images/categories/card.webp",
  bannerImageUrl: "/images/collections/action-figures-shelf.jpeg",
  isActive: true, displayOrder: 0, ...changes,
});

it("keeps the collection banner when the category card photo changes", () => {
  const initial = category({});
  const changedCard = category({ imageUrl: "/images/categories/new-card.webp" });
  expect(collectionBanner(changedCard)?.src).toBe(collectionBanner(initial)?.src);
  expect(collectionBanner(category({ bannerImageUrl: "/images/collections/new-banner.webp" }))?.src)
    .toBe("/images/collections/new-banner.webp");
});
