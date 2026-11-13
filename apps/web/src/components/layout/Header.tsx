"use client";
import Link from "next/link";
import { lockBodyScroll } from "@/lib/scroll-lock";
import { BrandLogo } from "./BrandLogo";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { useStore } from "../commerce/StoreProvider";
import { BagItems } from "../commerce/Commerce";
import { matchesSearch } from "@/lib/discovery";
import { categoryKind } from "@/lib/taxonomy";
import { navigation } from "@/lib/config";
import { ButtonLink, IconButton, Input } from "../ui/Primitives";
export function Header() {
  const pathname = usePathname();
  const store = useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const { query, setQuery } = store;
  const count = Object.values(store.bag).reduce((a, b) => a + b, 0);
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [dropdown, setDropdown] = useState<{ label: string | null; pathname: string }>({ label: null, pathname });
  const openDropdown = dropdown.pathname === pathname ? dropdown.label : null;
  const setOpenDropdown = useCallback((label: string | null) => setDropdown({ label, pathname }), [pathname]);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const closeDropdown = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpenDropdown(null);
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.closest(".desktop-nav")
    ) {
      document.activeElement.blur();
    }
  }, [setOpenDropdown]);

  const handleMouseEnter = (label: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (["Collections", "Categories"].includes(label)) {
      setOpenDropdown(label);
    } else {
      setOpenDropdown(null);
    }
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".desktop-nav")) {
        closeDropdown();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDropdown]);

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
    } else {
      el.close();
    }
    if (!store.drawer) return;
    const unlock = lockBodyScroll();
    return () => {
      unlock();
      if (el.open) el.close();
    };
  }, [store.drawer, pathname]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <>
      <header className={`header ${pathname === "/" ? "header--home" : ""}`}>
        <Link className="wordmark" href="/" aria-label="HIMATU home">
          <BrandLogo />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const hasDropdown = ["Collections", "Categories"].includes(item.label);
            const isOpen = openDropdown === item.label;

            return (
              <div
                className={`nav-item ${isOpen ? "is-open" : ""}`}
                key={item.href}
                onMouseEnter={() => handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  aria-expanded={hasDropdown ? isOpen : undefined}
                  onClick={closeDropdown}
                >
                  {item.label}
                  {hasDropdown && (
                    <ChevronDown
                      size={12}
                      style={{
                        transition: "transform 0.2s ease",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  )}
                </Link>
                {item.label === "Categories" && (
                  <div
                    className={`nav-dropdown nav-dropdown--mega ${isOpen ? "is-open" : ""}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a")) {
                        closeDropdown();
                      }
                    }}
                  >
                    <div className="nav-mega-column">
                      <h3>Featured</h3>
                      <Link href="/shop?new=1&sort=new" onClick={closeDropdown}>New Arrivals <ArrowUpRight size={14} /></Link>
                      <Link href="/shop" onClick={closeDropdown}>Shop All <ArrowUpRight size={14} /></Link>
                      <Link href="/collections" onClick={closeDropdown}>All Collections <ArrowUpRight size={14} /></Link>
                    </div>
                    <div className="nav-mega-column">
                      <h3>Shop by type</h3>
                      {store.categoryRegistry.filter(c => categoryKind(c) === "PRODUCT_TYPE").map(c => (
                        <Link href={`/categories/${c.slug}`} key={c.slug} onClick={closeDropdown}>
                          {c.name}<ArrowUpRight size={14} />
                        </Link>
                      ))}
                    </div>
                    <div className="nav-mega-column">
                      <h3>Anime worlds</h3>
                      {store.categoryRegistry.filter(c => categoryKind(c) === "FRANCHISE" && c.family === "ANIME").slice(0, 6).map(c => (
                        <Link href={`/collections/${c.slug}`} key={c.slug} onClick={closeDropdown}>
                          {c.name}<ArrowUpRight size={14} />
                        </Link>
                      ))}
                    </div>
                    <div className="nav-mega-column">
                      <h3>More to explore</h3>
                      {store.categoryRegistry.filter(c => categoryKind(c) === "FRANCHISE" && c.family !== "ANIME").slice(0, 5).map(c => (
                        <Link href={`/collections/${c.slug}`} key={c.slug} onClick={closeDropdown}>
                          {c.name}<ArrowUpRight size={14} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {item.label === "Collections" && (
                  <div
                    className={`nav-dropdown nav-dropdown--mega ${isOpen ? "is-open" : ""}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a")) {
                        closeDropdown();
                      }
                    }}
                  >
                    <div className="nav-mega-column">
                      <h3>Explore collections</h3>
                      <Link href="/collections?family=ALL" onClick={closeDropdown}>All worlds <ArrowUpRight size={14} /></Link>
                      <Link href="/collections?family=ANIME" onClick={closeDropdown}>Anime <ArrowUpRight size={14} /></Link>
                      <Link href="/collections?family=MARVEL" onClick={closeDropdown}>Marvel <ArrowUpRight size={14} /></Link>
                      <Link href="/collections?family=DC" onClick={closeDropdown}>DC <ArrowUpRight size={14} /></Link>
                      <Link href="/collections?family=MOVIES" onClick={closeDropdown}>Movies <ArrowUpRight size={14} /></Link>
                    </div>
                    <div className="nav-mega-column">
                      <h3>Anime favourites</h3>
                      {store.categoryRegistry.filter(c => categoryKind(c) === "FRANCHISE" && c.family === "ANIME").slice(0, 5).map(c => (
                        <Link href={`/collections/${c.slug}`} key={c.slug} onClick={closeDropdown}>
                          {c.name}<ArrowUpRight size={14} />
                        </Link>
                      ))}
                    </div>
                    <div className="nav-mega-column">
                      <h3>More anime</h3>
                      {store.categoryRegistry.filter(c => categoryKind(c) === "FRANCHISE" && c.family === "ANIME").slice(5).map(c => (
                        <Link href={`/collections/${c.slug}`} key={c.slug} onClick={closeDropdown}>
                          {c.name}<ArrowUpRight size={14} />
                        </Link>
                      ))}
                    </div>
                    <div className="nav-mega-column">
                      <h3>Beyond anime</h3>
                      {store.categoryRegistry.filter(c => categoryKind(c) === "FRANCHISE" && c.family !== "ANIME").map(c => (
                        <Link href={`/collections/${c.slug}`} key={c.slug} onClick={closeDropdown}>
                          {c.name}<ArrowUpRight size={14} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                Store Management
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
                ...navigation.flatMap(item => item.label === "Categories" ? [item, { label: "New Arrivals", href: "/shop?new=1&sort=new" }] : [item]),
                { label: "Wishlist", href: "/wishlist" },
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
                    Store Management
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
                {store.pricedCatalogue.filter((p) => matchesSearch(p, query)).length} figures found
              </p>
              <div className="search-results">
                {store.pricedCatalogue
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
                {!store.pricedCatalogue.some((p) => matchesSearch(p, query)) && (
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
