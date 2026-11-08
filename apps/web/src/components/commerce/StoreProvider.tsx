"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
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
interface Store extends DemoState {
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

  useEffect(() => {
    initStorefrontSession();
  }, []);
  return (
    <StoreContext.Provider
      value={{
        ...state,
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
