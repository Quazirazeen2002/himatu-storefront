// Owner-requested illustrative BDT amounts. These are demo prices, not verified selling prices.
export const demoPricesById: Record<string, number> = {
  "naruto-uzumaki": 3290,
  "son-goku": 3490,
  "eren-yeager": 3290,
  "tanjiro-kamado": 4490,
  "ichigo-kurosaki": 3590,
  "gon-freecss": 6490,
  "sung-jinwoo": 4990,
  "satoru-gojo": 3290,
  "yoichi-isagi": 2990,
  "light-yagami": 2790,
  "spider-man": 6990,
  "batman": 7490,
  "harry-potter": 2990,
  "naruto-keychain": 199,
  "tanjiro-nichirin-sword": 4490,
  "naruto-sasuke-shirt": 799,
  "konoha-pin": 299,
};
export function demoPriceFor(id: string): number {
  const price = demoPricesById[id];
  if (!Number.isSafeInteger(price) || price <= 0) throw new Error(`Missing demo price for ${id}`);
  return price;
}
