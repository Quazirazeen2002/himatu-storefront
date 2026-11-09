import { pricing, pricedTotal, salePriceForDiscount } from "../src/lib/pricing";
import { discover, emptyFilters, paginate } from "../src/lib/discovery";
import { products } from "../src/lib/config";
import { concepts } from "../src/lib/catalogue";

describe("Original prices and genuine discounts", () => {
  it("applies the owner-approved 15 percent without changing original prices", () => {
    expect(salePriceForDiscount(6500,15)).toBe(5525);
    expect(salePriceForDiscount(20,15)).toBe(17);
    expect(salePriceForDiscount(6500,0)).toBeNull();
    expect(() => salePriceForDiscount(6500,100)).toThrow();
    expect(products.every(p => p.salePrice === salePriceForDiscount(p.price,15))).toBe(true);
  });
  it("retains the original price and uses the lower sale price", () => {
    const product = { ...products[0], price: 6500, salePrice: 5900 };
    expect(pricing(product)).toEqual({ original: 6500, current: 5900, discounted: true, saving: 600 });
    expect(product.price).toBe(6500);
    expect(pricedTotal([product], { [product.id]: 2 }).subtotal).toBe(11800);
  });
  it.each([undefined, null, 0, -1, 6500, 7000, NaN, 5900.5])("ignores invalid sale price %s", salePrice => {
    expect(pricing({ price: 6500, salePrice }).current).toBe(6500);
    expect(pricing({ price: 6500, salePrice }).discounted).toBe(false);
  });
  it("sorts and filters by the actual discounted price", () => {
    const a = { ...products[0], price: 6500, salePrice: 4000 };
    const b = { ...products[1], price: 4800, salePrice: null };
    expect(discover([b,a], emptyFilters, "low").map(p => p.id)).toEqual([a.id,b.id]);
    expect(discover([a,b], { ...emptyFilters, maximum: "4500" }, "low")).toEqual([a]);
  });
  it("keeps all seven AI concepts unpriced and paginates the expanded catalogue", () => {
    expect(concepts).toHaveLength(7);
    expect(concepts.every(p => p.price === undefined && p.availability === undefined)).toBe(true);
    const all = [...products,...concepts];
    expect(paginate(all,1).items).toHaveLength(9);
    expect(paginate(all,2).items).toHaveLength(all.length - 9);
  });
});
