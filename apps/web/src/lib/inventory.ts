import type { ProductDto } from "@himatu/shared";
export type InventoryGrouping = "product-type" | "franchise";
export type StockFilter = "all" | "low" | "out";
export const availableStock = (product: ProductDto) => Math.max(0, (product.inventory?.quantity || 0) - (product.inventory?.reservedQuantity || 0));
export function inventoryGroups(products: ProductDto[], grouping: InventoryGrouping, search = "", stock: StockFilter = "all") {
  const groups = new Map<string, { id: string; name: string; products: ProductDto[] }>();
  const term = search.trim().toLowerCase();
  for (const product of products) {
    const category = grouping === "product-type" ? product.productType : product.category;
    const quantity = availableStock(product);
    if ((stock === "low" && (quantity === 0 || quantity > 5)) || (stock === "out" && quantity > 0)) continue;
    if (term && ![product.name, product.sku, product.category?.name, product.productType?.name].filter(Boolean).join(" ").toLowerCase().includes(term)) continue;
    const id = category?.id || "unassigned";
    if (!groups.has(id)) groups.set(id, { id, name: category?.name || "Unassigned", products: [] });
    groups.get(id)!.products.push(product);
  }
  return [...groups.values()].sort((a,b) => a.name.localeCompare(b.name)).map(group => ({...group, products: [...group.products].sort((a,b) => a.name.localeCompare(b.name))}));
}
