"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { initStorefrontSession } from "@/lib/analytics-tracker";
import {
  getSnapshot,
  getServerSnapshot,
  subscribe,
  setQuantity,
  toggleWish,
  markViewed,
  type DemoState,
} from "@/lib/demo-store";
import { products } from "@/lib/config";
import { catalogue } from "@/lib/catalogue";
import { fallbackCategories } from "@/lib/taxonomy";
import type { CategoryDto } from "@himatu/shared";
import { getCategories, getProducts } from "@/lib/commerce-api";
import type { Product, FigureProduct, ReferenceProduct } from "@/lib/types";

interface Store extends DemoState {
  categoryRegistry: CategoryDto[];
  pricedProducts: FigureProduct[];
  bagProducts: (FigureProduct | ReferenceProduct)[];
  pricedCatalogue: Product[];
  query: string;
  setQuery: (q: string) => void;
  setQuantity: typeof setQuantity;
  toggleWish: typeof toggleWish;
  markViewed: typeof markViewed;
  drawer: "bag" | "menu" | "search" | null;
  setDrawer: (drawer: Store["drawer"]) => void;
}
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [drawer, setDrawer] = useState<Store["drawer"]>(null);
  const [query, setQuery] = useState("");
  const [categoryRegistry, setCategoryRegistry] = useState<CategoryDto[]>(fallbackCategories);
  useEffect(() => {
    let active = true;
    const refresh = () => getCategories().then(categories => { if (active) setCategoryRegistry(categories); }).catch(() => {});
    refresh(); window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, []);
  const [prices, setPrices] = useState<Record<string, { price: number; salePrice: number | null; productCategory?: string; collection?: string; franchise?: string }>>({});
  useEffect(() => {
    let active = true;
    const refresh = () => getProducts({ limit: 100 }).then(result => {
      if (!active) return;
      const next: typeof prices = {};
      for (const item of result.items) {
        const match = products.find(product => product.id === item.slug || product.name === item.name);
        if (match && Number.isSafeInteger(item.price) && item.price > 0) {
          next[match.id] = { price: item.price, salePrice: item.salePrice, productCategory: item.productType?.slug || match.productCategory, collection: item.category?.slug || match.collection, franchise: item.category?.name || match.franchise };
        }
      }
      setPrices(next);
    }).catch(() => { /* Keep existing catalogue prices when the API is unavailable. */ });
    refresh();
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, []);
  const pricedProducts = useMemo(() => products.map(product => ({ ...product, ...prices[product.id] })), [prices]);
  const pricedCatalogue = useMemo<Product[]>(() => catalogue.map(product => (product.kind === "concept" || product.kind === "reference") ? product : ({ ...product, ...prices[product.id] })), [prices]);

  const bagProducts = useMemo(() => pricedCatalogue.filter((product): product is FigureProduct | ReferenceProduct => product.kind !== "concept"), [pricedCatalogue]);

  useEffect(() => {
    initStorefrontSession();
  }, []);
  return (
    <StoreContext.Provider
      value={{
        ...state,
        pricedProducts,
        bagProducts,
        categoryRegistry,
        pricedCatalogue,
        drawer,
        setDrawer,
        query,
        setQuery,
        setQuantity,
        toggleWish,
        markViewed,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw Error("StoreProvider is required");
  return store;
}
