import type { ProductDto } from "@himatu/shared";
import type { FigureProduct, Product } from "./types";
import { catalogue } from "./catalogue";

const productTypes: Record<string, FigureProduct["type"]> = {
  "action-figures": "Action figure", keychains: "Keychain", katanas: "Display sword",
  "t-shirts": "T-shirt", accessories: "Pin",
};

/** Database stock, prices and photographs take precedence over the legacy catalogue. */
export function toStorefrontProduct(item: ProductDto): FigureProduct {
  const original = catalogue.find(p => p.id === item.slug || p.name === item.name);
  const specifications = Object.fromEntries(Object.entries(item.specifications || {}).map(([key, value]) => [key.toLowerCase(), String(value)]));
  return {
    ...original,
    kind: "figure",
    id: item.slug,
    databaseId: item.id,
    name: item.name,
    character: specifications.character || original?.character || item.name,
    description: item.description,
    franchise: item.category?.name || original?.franchise || "HIMATU",
    collection: item.category?.slug || original?.collection || "other-collections",
    productCategory: item.productType?.slug || original?.productCategory,
    type: productTypes[item.productType?.slug || ""] || original?.type || "Collectible figurine",
    color: original?.color || "#737373", art: original?.art || "figure",
    price: item.price, salePrice: item.salePrice,
    availability: (item.inventory?.availableQuantity || 0) > 0 ? "in-stock" : "sold-out",
    stockQuantity: item.inventory?.availableQuantity || 0,
    isFeatured: item.isFeatured,
    addedAt: Date.parse(item.createdAt) || 0,
    isNew: original?.isNew || false,
    specifications,
    uploadedImages: [...item.images].sort((a,b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder).map(image => ({ src: image.imageUrl, alt: image.altText || item.name })),
  };
}

export function mergeStorefrontProducts(items: ProductDto[]): Product[] {
  const active = items.filter(item => item.isActive).map(toStorefrontProduct);
  // Source-attributed demo references remain separate; database-managed figures are authoritative.
  const managedSlugs = new Set(items.map(item => item.slug));
  const managedNames = new Set(items.map(item => item.name));
  return [...active, ...catalogue.filter(item => item.kind === "reference" && !managedSlugs.has(item.id) && !managedNames.has(item.name))];
}
