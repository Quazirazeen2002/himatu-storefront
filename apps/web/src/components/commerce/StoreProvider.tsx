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
  registerStoreProducts,
  type DemoState,
} from "@/lib/demo-store";
import { fallbackCategories } from "@/lib/taxonomy";
import type { CategoryDto } from "@himatu/shared";
import { getCategories, getAllProducts } from "@/lib/commerce-api";
import { mergeStorefrontProducts } from "@/lib/storefront-products";
import type { Product, FigureProduct, ReferenceProduct } from "@/lib/types";

interface Store extends DemoState {
  catalogueStatus: "loading" | "ready" | "error";
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
  const [catalogueStatus, setCatalogueStatus] = useState<Store["catalogueStatus"]>("loading");
  const [pricedCatalogue, setCatalogue] = useState<Product[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = () => getAllProducts().then(items => {
      if (!active) return;
      const next = mergeStorefrontProducts(items);
      registerStoreProducts(next);
      setCatalogue(next);
      setCatalogueStatus("ready");
    }).catch(() => { if (active) setCatalogueStatus(status => status === "ready" ? status : "error"); });
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("himatu:catalogue-updated", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); window.removeEventListener("himatu:catalogue-updated", refresh); };
  }, []);
  const pricedProducts = useMemo(() => pricedCatalogue.filter((p): p is FigureProduct => p.kind !== "concept" && p.kind !== "reference"), [pricedCatalogue]);

  const bagProducts = useMemo(() => pricedCatalogue.filter((product): product is FigureProduct | ReferenceProduct => product.kind !== "concept"), [pricedCatalogue]);

  useEffect(() => {
    initStorefrontSession();
  }, []);
  return (
    <StoreContext.Provider
      value={{
        ...state,
        catalogueStatus,
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
