import { products } from "./config";
import type { Product } from "./types";
import { catalogue, concepts } from "./catalogue";
export interface DemoState {
  bag: Record<string, number>;
  wishlist: string[];
  recent: string[];
  storageAvailable: boolean;
}
export const STORAGE_KEY = "himatu-demo-v2";
const empty: DemoState = {
  bag: {},
  wishlist: [],
  recent: [],
  storageAvailable: true,
};
let snapshot: DemoState | undefined;
const listeners = new Set<() => void>();
let storeProducts: Product[] = catalogue;
export function registerStoreProducts(items: Product[]) { storeProducts = items; }
const validId = (id: string) => /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(id);
const known = (id: string) => [...storeProducts, ...concepts].some((p) => p.id === id);
const canAddToBag = (id: string) =>
  storeProducts.some((p) => p.id === id && p.kind !== "concept" && (p.kind === "reference" || p.availability !== "sold-out"));
export function sanitizeState(value: unknown): DemoState {
  if (!value || typeof value !== "object") return { ...empty };
  const raw = value as Record<string, unknown>;
  const bag: Record<string, number> = {};
  if (raw.bag && typeof raw.bag === "object" && !Array.isArray(raw.bag)) {
    for (const [id, q] of Object.entries(raw.bag)) {
      if (
        validId(id) &&
        (!known(id) || canAddToBag(id)) &&
        typeof q === "number" &&
        Number.isFinite(q) &&
        q > 0
      )
        bag[id] = Math.min(10, Math.floor(q));
    }
  }
  const ids = (input: unknown) =>
    Array.isArray(input)
      ? [
          ...new Set(
            input.filter(
              (id): id is string => typeof id === "string" && validId(id),
            ),
          ),
        ].slice(0, 30)
      : [];
  return {
    bag,
    wishlist: ids(raw.wishlist),
    recent: ids(raw.recent).slice(0, 8),
    storageAvailable: true,
  };
}
function read(): DemoState {
  try {
    return sanitizeState(
      JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"),
    );
  } catch {
    return { ...empty, storageAvailable: false };
  }
}
export function getSnapshot() {
  if (!snapshot) snapshot = read();
  return snapshot;
}
export const getServerSnapshot = () => empty;
export function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      snapshot = read();
      listeners.forEach((fn) => fn());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
function update(change: (state: DemoState) => DemoState) {
  snapshot = change(getSnapshot());
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bag: snapshot.bag,
        wishlist: snapshot.wishlist,
        recent: snapshot.recent,
      }),
    );
  } catch {
    snapshot = { ...snapshot, storageAvailable: false };
  }
  listeners.forEach((fn) => fn());
}
export function setQuantity(id: string, quantity: number) {
  if ((!canAddToBag(id) && quantity !== 0) || !Number.isFinite(quantity)) return;
  update((state) => {
    const bag = { ...state.bag };
    const q = Math.max(0, Math.min(10, Math.floor(quantity)));
    if (q) bag[id] = q;
    else delete bag[id];
    return { ...state, bag };
  });
}
export function toggleWish(id: string) {
  if (known(id))
    update((state) => ({
      ...state,
      wishlist: state.wishlist.includes(id)
        ? state.wishlist.filter((value) => value !== id)
        : [...state.wishlist, id],
    }));
}
export function markViewed(id: string) {
  if (known(id))
    update((state) => ({
      ...state,
      recent: [id, ...state.recent.filter((value) => value !== id)].slice(0, 8),
    }));
}
export function getTotals(bag: Record<string, number>) {
  return products.reduce(
    (total, p) => ({
      subtotal: total.subtotal + p.price * (bag[p.id] || 0),
      count: total.count + (bag[p.id] || 0),
    }),
    { subtotal: 0, count: 0 },
  );
}
