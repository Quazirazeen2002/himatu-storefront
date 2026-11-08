"use client";
import Link from "next/link";
import { SessionLink } from "../commerce/SessionLink";
import { ProfileMenu } from "./ProfileMenu";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  ArrowUpRight,
  ChevronDown,
  X,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { useStore } from "../commerce/StoreProvider";
import { BagItems } from "../commerce/Commerce";
import { catalogue, CONCEPT_LABEL } from "@/lib/catalogue";
import { matchesSearch } from "@/lib/discovery";
import { navigation, collections } from "@/lib/config";
import { ButtonLink, DemoNotice, IconButton, Input } from "../ui/Primitives";
export function Header() {
  const pathname = usePathname();
  const store = useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const { query, setQuery } = store;
  const count = Object.values(store.bag).reduce((a, b) => a + b, 0);
  const [session, setSession] = useState<CustomerSession | null>(null);

  useEffect(() => {
    authService
      .getSession()
      .then(setSession)
      .catch(() => setSession(null));

    const handleAuthChange = () => {
      authService
        .getSession()
        .then(setSession)
        .catch(() => setSession(null));
    };

    window.addEventListener("himatu:auth-change", handleAuthChange);
    return () => {
      window.removeEventListener("himatu:auth-change", handleAuthChange);
    };
  }, [pathname]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (store.drawer) {
      if (!el.open) el.showModal();
      document.body.style.overflow = "hidden";
    } else {
      el.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [store.drawer]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <>
      <div className="announcement">
        HIMATU — PREMIUM FIGURES & COLLECTIBLES{" "}
        <span>DISCOVER. COLLECT. DISPLAY.</span>
      </div>
      <header className="header">
        <Link className="wordmark" href="/" aria-label="HIMATU home">
          HIMATU
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <div className="nav-item" key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
                {item.label === "Collections" && <ChevronDown size={12} />}
              </Link>
              {item.label === "Collections" && (
                <div className="nav-dropdown">
                  {collections.map((c) => (
                    <Link href={`/collections/${c.slug}`} key={c.slug}>
                      {c.name}
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {session?.user?.role === "ADMIN" && (
            <div className="nav-item">
              <Link
                href="/admin"
                style={{
                  color: "var(--accent, #e50914)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                }}
              >
                <ShieldCheck size={14} />
                Admin Dashboard
              </Link>
            </div>
          )}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <IconButton
            label="Search figures"
            onClick={() => store.setDrawer("search")}
          >
            <Search size={20} />
          </IconButton>
          <Link
            className="icon-button wishlist-icon"
            href="/wishlist"
            aria-label="Wishlist"
          >
            <Heart size={20} />
            {store.wishlist.length > 0 && (
              <span className="count">{store.wishlist.length}</span>
            )}
          </Link>
          <IconButton
            label={`Open shopping bag, ${count} items`}
            onClick={() => store.setDrawer("bag")}
          >
            <ShoppingBag size={20} />
            {count > 0 && <span className="count">{count}</span>}
          </IconButton>
          <ProfileMenu />
          <IconButton
            className="icon-button mobile-menu"
            label="Open navigation"
            onClick={() => store.setDrawer("menu")}
          >
            <Menu size={22} />
          </IconButton>
        </div>
      </header>
      <dialog
        ref={dialog}
        className={`drawer drawer--${store.drawer || "closed"}`}
        aria-labelledby="drawer-title"
        onCancel={() => store.setDrawer(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            store.setDrawer(null);
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) store.setDrawer(null);
        }}
      >
        <div
          className="drawer-inner"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) store.setDrawer(null);
          }}
        >
          <div className="drawer-header">
            <h2 id="drawer-title">
              {store.drawer === "bag"
                ? "Your Shopping Bag"
                : store.drawer === "search"
                  ? "Find your next favourite."
                  : "Explore HIMATU"}
            </h2>
            <IconButton
              label="Close panel"
              onClick={() => store.setDrawer(null)}
            >
              <X />
            </IconButton>
          </div>
          {store.drawer === "menu" && (
            <nav className="mobile-nav" aria-label="Mobile navigation">
              {[
                ...navigation,
                { label: "Wishlist", href: "/wishlist" },
                { label: "About Himatu", href: "/about" },
              ].map((item) => (
                <Link
                  onClick={() => store.setDrawer(null)}
                  key={item.href}
                  href={item.href}
                >
                  {item.label}
                  <ArrowUpRight size={20} />
                </Link>
              ))}
              {session?.user?.role === "ADMIN" && (
                <Link
                  onClick={() => store.setDrawer(null)}
                  href="/admin"
                  style={{
                    color: "var(--accent, #e50914)",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={18} />
                    Admin Dashboard
                  </span>
                  <ArrowUpRight size={20} />
                </Link>
              )}
              <SessionLink />
            </nav>
          )}
          {store.drawer === "bag" && (
            <>
              <BagItems />
              <div onClick={() => store.setDrawer(null)}>
                <ButtonLink href="/bag">VIEW BAG & SUMMARY</ButtonLink>
              </div>
            </>
          )}
          {store.drawer === "search" && (
            <>
              <Input
                id="site-search"
                label="Search figures and collectibles"
                type="search"
                placeholder="Try Luffy, Zoro or Sanji"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="button button--text"
                  onClick={() => setQuery("")}
                >
                  CLEAR SEARCH
                </button>
              )}
              <p className="demo-note" role="status">
                {catalogue.filter((p) => matchesSearch(p, query)).length} figures found
              </p>
              <div className="search-results">
                {catalogue
                  .filter((p) => matchesSearch(p, query))
                  .map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      onClick={() => store.setDrawer(null)}
                    >
                      <span>
                        {p.name}
                        <small>
                          {p.franchise}
                        </small>
                      </span>
                      <ArrowUpRight size={20} />
                    </Link>
                  ))}
                {!catalogue.some((p) => matchesSearch(p, query)) && (
                  <p>No figures found. Try searching by anime or character name.</p>
                )}
              </div>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
