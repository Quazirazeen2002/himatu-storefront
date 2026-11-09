import type { FigureProduct } from "./types";

export function salePriceForDiscount(price: number, percent: number): number | null {
  if (!Number.isSafeInteger(price) || price <= 0 || !Number.isFinite(percent) || percent < 0 || percent >= 100) {
    throw new Error("Use a positive whole-BDT price and a discount from 0 to below 100 percent.");
  }
  if (percent === 0) return null;
  const sale = Math.round(price * (100 - percent) / 100);
  return sale > 0 && sale < price ? sale : null;
}

export function pricing(product: Pick<FigureProduct, "price" | "salePrice">) {
  const original = product.price;
  const sale = product.salePrice;
  const discounted = typeof sale === "number" && Number.isSafeInteger(sale) && sale > 0 && sale < original;
  const current = discounted ? sale : original;
  return { original, current, discounted, saving: original - current };
}

export function pricedTotal(products: Pick<FigureProduct, "id" | "price" | "salePrice">[], bag: Record<string, number>) {
  return products.reduce((total, product) => ({
    subtotal: total.subtotal + pricing(product).current * (bag[product.id] || 0),
    count: total.count + (bag[product.id] || 0),
  }), { subtotal: 0, count: 0 });
}
