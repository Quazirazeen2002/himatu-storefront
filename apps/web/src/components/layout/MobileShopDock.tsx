"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid2X2, Heart, ShoppingBag } from "lucide-react";
import { useStore } from "../commerce/StoreProvider";
export function MobileShopDock() {
  const pathname = usePathname();
  const store = useStore();
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.includes("sign-in") || pathname.includes("create-account")) return null;
  const count = Object.values(store.bag).reduce((sum, quantity) => sum + quantity, 0);
  return <nav className="mobile-shop-dock" aria-label="Mobile shopping shortcuts">
    <Link href="/" aria-current={pathname === "/" ? "page" : undefined}><Home size={19} /><span>Home</span></Link>
    <Link href="/categories" aria-current={pathname.startsWith("/categories") ? "page" : undefined}><Grid2X2 size={19} /><span>Categories</span></Link>
    <Link href="/wishlist" aria-current={pathname === "/wishlist" ? "page" : undefined}><Heart size={19} /><span>Wishlist</span></Link>
    <button type="button" onClick={() => store.setDrawer("bag")}><ShoppingBag size={19} /><span>Bag {count > 0 && <b>{count}</b>}</span></button>
  </nav>;
}
