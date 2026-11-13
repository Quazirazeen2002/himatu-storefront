import type { ProductDto } from "@himatu/shared";
import { mergeStorefrontProducts, toStorefrontProduct } from "../src/lib/storefront-products";
import { assets } from "../src/lib/assets";
import { registerStoreProducts, sanitizeState } from "../src/lib/demo-store";
import { getAllProducts } from "../src/lib/commerce-api";
const product: ProductDto = {
  id: "database-id", slug: "new-admin-figure", sku: "QA-1", name: "Admin figure", description: "Newly published collectible",
  shortDescription: null, price: 2000, salePrice: 1700, currency: "BDT", categoryId: "franchise-id",
  isActive: true, isFeatured: true, createdAt: "2026-11-10T00:00:00Z", updatedAt: "2026-11-10T00:00:00Z",
  inventory: { quantity: 4, reservedQuantity: 1, availableQuantity: 3 },
  images: [
    { id:"second", productId:"database-id", storagePath:null, imageUrl:"https://example.com/second.jpg", altText:"Side view", sortOrder:0, isPrimary:false },
    { id:"cover", productId:"database-id", storagePath:null, imageUrl:"https://example.com/cover.jpg", altText:"Front view", sortOrder:1, isPrimary:true },
  ],
};
it("publishes an admin-created figure with current stock, sale price and ordered gallery", () => {
  const p = toStorefrontProduct(product);
  expect(p).toMatchObject({id:product.slug, databaseId:product.id, price:2000, salePrice:1700, stockQuantity:3, availability:"in-stock"});
  expect(assets.product(p).src).toBe("https://example.com/cover.jpg");
  expect(assets.gallery(p)).toHaveLength(2);
  expect(toStorefrontProduct({...product, inventory:{quantity:1,reservedQuantity:1,availableQuantity:0}}).availability).toBe("sold-out");
  registerStoreProducts([p]);
  expect(sanitizeState({bag:{[p.id]:2},wishlist:[p.id]})).toMatchObject({bag:{[p.id]:2},wishlist:[p.id]});
});
it("does not resurrect archived database figures from the legacy catalogue", () => {
  expect(mergeStorefrontProducts([{...product,isActive:false}]).some(p=>p.id===product.slug)).toBe(false);
  expect(mergeStorefrontProducts([]).some(p=>p.id==="straw-hat-captain")).toBe(false);
});
it("retains a dynamic bag through hydration before API products load", () => {
  registerStoreProducts([]);
  expect(sanitizeState({bag:{"new-admin-figure":2}}).bag).toEqual({"new-admin-figure":2});
});
it("loads every backend page rather than truncating the storefront at fifty products", async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValueOnce({ok:true,json:async()=>({items:[product],totalPages:2})}).mockResolvedValueOnce({ok:true,json:async()=>({items:[{...product,slug:"page-two"}],totalPages:2})});
  try {
    expect((await getAllProducts()).map(p=>p.slug)).toEqual(["new-admin-figure","page-two"]);
    expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining("page=2"),expect.anything());
  } finally { global.fetch = originalFetch; }
});

it("does not publish former sample references when the managed catalogue is empty", () => {
  expect(mergeStorefrontProducts([])).toEqual([]);
});
