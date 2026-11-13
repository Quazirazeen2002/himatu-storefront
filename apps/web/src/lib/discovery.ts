import { pricing } from "./pricing";
import type { Product } from "./types";
export interface Filters {
  query: string;
  collection: string;
  category: string;
  minimum: string;
  maximum: string;
  availability: string;
  type: string;
}
export const emptyFilters: Filters = {
  query: "",
  collection: "all",
  category: "all",
  minimum: "",
  maximum: "",
  availability: "all",
  type: "all",
};
export function matchesSearch(p: Product, query: string) {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((term) =>
      `${p.name} ${p.character} ${p.franchise} ${p.description}`
        .toLowerCase()
        .includes(term),
    );
}
export function discover(catalog: Product[], filters: Filters, sort: string) {
  const result = catalog.filter(
    (p) =>
      matchesSearch(p, filters.query) &&
      (filters.collection === "all" || p.collection === filters.collection) &&
      (filters.category === "all" || p.productCategory === filters.category) &&
      (filters.availability === "all" ||
        p.availability === filters.availability) &&
      (filters.type === "all" || p.type === filters.type) &&
      (!filters.minimum ||
        (p.price !== undefined && pricing(p).current >= Number(filters.minimum))) &&
      (!filters.maximum ||
        (p.price !== undefined && pricing(p).current <= Number(filters.maximum))),
  );
  return result.sort((a, b) => {
    if (sort === "low" || sort === "high") {
      if (a.price === undefined && b.price === undefined) return 0;
      if (a.price === undefined) return 1;
      if (b.price === undefined) return -1;
      return sort === "low" ? pricing(a).current - pricing(b).current : pricing(b).current - pricing(a).current;
    }
    return sort === "new"
      ? b.addedAt - a.addedAt
      : sort === "name"
        ? a.name.localeCompare(b.name)
        : 0;
  });
}
export const PAGE_SIZE = 16;
export function paginate<T>(items: T[], requested: number) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(
    pages,
    Math.max(1, Number.isSafeInteger(requested) ? requested : 1),
  );
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    page,
    pages,
    from: items.length ? start + 1 : 0,
    to: Math.min(start + PAGE_SIZE, items.length),
    total: items.length,
  };
}
