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
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { authService, type CustomerSession } from "@/lib/auth-service";
import { useStore } from "../commerce/StoreProvider";
import { BagItems } from "../commerce/Commerce";
import { catalogue } from "@/lib/catalogue";
import { matchesSearch } from "@/lib/discovery";
import { ButtonLink, IconButton, Input } from "../ui/Primitives";
import { motion, AnimatePresence } from "framer-motion";

interface NavDropdownItem {
  name: string;
  href: string;
  tag?: string;
}

interface CenterNavItem {
  label: string;
  href: string;
  dropdown?: NavDropdownItem[];
}

const CENTER_NAVIGATION: CenterNavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "Custom Printing", href: "/3d-printing" },
  {
    label: "Collections",
    href: "/collections",
    dropdown: [
      { name: "All Collections", href: "/collections" },
      { name: "One Piece", href: "/collections/one-piece" },
      { name: "Naruto", href: "/collections/naruto" },
      { name: "Dragon Ball", href: "/collections/dragon-ball" },
      { name: "Jujutsu Kaisen", href: "/collections/jujutsu-kaisen" },
      { name: "Demon Slayer", href: "/collections/demon-slayer" },
      { name: "Other Figures", href: "/collections/other-collections" },
    ],
  },
  {
    label: "Anime Zones",
    href: "/collections",
    dropdown: [
      { name: "One Piece Universe", href: "/collections/one-piece", tag: "8 Figures" },
      { name: "Naruto Universe", href: "/collections/naruto", tag: "Ninja Era" },
      { name: "Dragon Ball Universe", href: "/collections/dragon-ball", tag: "Super Saiyan" },
      { name: "Jujutsu Kaisen Zone", href: "/collections/jujutsu-kaisen", tag: "Cursed Clash" },
      { name: "Demon Slayer Zone", href: "/collections/demon-slayer", tag: "Breathing Arts" },
    ],
  },
  { label: "About", href: "/about" },
];

export function Header() {
  const pathname = usePathname();
  const store = useStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const { query, setQuery } = store;
  const count = Object.values(store.bag).reduce((a, b) => a + b, 0);
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Transparent-to-solid scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <div className="announcement">
        HIMATU — PREMIUM FIGURES & COLLECTIBLES{" "}
        <span>DISCOVER. COLLECT. DISPLAY.</span>
      </div>

      <header
        className={`header ${isScrolled ? "header--scrolled" : "header--transparent"}`}
      >
        {/* Left: Brand Identity */}
        <Link className="wordmark" href="/" aria-label="HIMATU home">
          HIMATU<span className="wordmark-dot">.</span>
        </Link>

        {/* Center Navigation */}
        <nav className="desktop-nav" aria-label="Main navigation">
          {CENTER_NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            const hasMenu = !!item.dropdown;
            const isOpen = activeDropdown === item.label;

            return (
              <div
                className="nav-item"
                key={item.label}
                onMouseEnter={() => hasMenu && handleMouseEnter(item.label)}
                onMouseLeave={() => hasMenu && handleMouseLeave()}
              >
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={isOpen ? "active" : ""}
                >
                  {item.label}
                  {hasMenu && (
                    <ChevronDown
                      size={12}
                      className={`nav-chevron ${isOpen ? "rotated" : ""}`}
                    />
                  )}
                </Link>

                <AnimatePresence>
                  {isOpen && item.dropdown && (
                    <motion.div
                      className="cinematic-nav-dropdown"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                    >
                      {item.dropdown.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={() => setActiveDropdown(null)}
                        >
                          <span>{sub.name}</span>
                          {sub.tag ? (
                            <span className="dropdown-tag">{sub.tag}</span>
                          ) : (
                            <ArrowUpRight size={13} />
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {session?.user?.role === "ADMIN" && (
            <div className="nav-item">
              <Link
                href="/admin"
                style={{
                  color: "var(--accent, #a855f7)",
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

        {/* Right Actions */}
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

      {/* Modal Drawer: Menu, Bag, or Search */}
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
              <Link onClick={() => store.setDrawer(null)} href="/shop">
                Shop All Figures
                <ArrowUpRight size={20} />
              </Link>
              <Link onClick={() => store.setDrawer(null)} href="/3d-printing">
                Custom 3D Printing
                <ArrowUpRight size={20} />
              </Link>
              <Link onClick={() => store.setDrawer(null)} href="/collections">
                All Collections
                <ArrowUpRight size={20} />
              </Link>

              <div className="mobile-nav-subgroup">
                <span className="mobile-nav-subgroup-title">ANIME ZONES</span>
                {[
                  { name: "One Piece", href: "/collections/one-piece" },
                  { name: "Naruto", href: "/collections/naruto" },
                  { name: "Dragon Ball", href: "/collections/dragon-ball" },
                  { name: "Jujutsu Kaisen", href: "/collections/jujutsu-kaisen" },
                  { name: "Demon Slayer", href: "/collections/demon-slayer" },
                ].map((zone) => (
                  <Link
                    key={zone.href}
                    onClick={() => store.setDrawer(null)}
                    href={zone.href}
                    className="mobile-sublink"
                  >
                    {zone.name}
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </div>

              <Link onClick={() => store.setDrawer(null)} href="/wishlist">
                Wishlist
                <ArrowUpRight size={20} />
              </Link>
              <Link onClick={() => store.setDrawer(null)} href="/about">
                About HIMATU
                <ArrowUpRight size={20} />
              </Link>

              {session?.user?.role === "ADMIN" && (
                <Link
                  onClick={() => store.setDrawer(null)}
                  href="/admin"
                  style={{
                    color: "var(--accent, #a855f7)",
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
                        <small>{p.franchise}</small>
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
