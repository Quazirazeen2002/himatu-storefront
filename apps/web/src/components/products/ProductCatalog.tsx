"use client";
import Link from "next/link";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";
import { categoryKind, asCollection } from "@/lib/taxonomy";
import { products, availabilityLabel } from "@/lib/config";
import {
  discover,
  emptyFilters,
  paginate,
  type Filters,
} from "@/lib/discovery";
import { ProductGrid } from "./ProductCard";
import { Button, DemoNotice } from "../ui/Primitives";
import { useStore } from "../commerce/StoreProvider";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest Arrivals" },
  { value: "low", label: "Price: Low to High" },
  { value: "high", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

function CatalogContent({
  collection,
  productCategory,
  wishlist = false,
}: {
  collection?: string;
  productCategory?: string;
  wishlist?: boolean;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const store = useStore();
  const collections = store.categoryRegistry.filter(c => categoryKind(c) === "FRANCHISE").map(asCollection);
  const productCategories = store.categoryRegistry.filter(c => categoryKind(c) === "PRODUCT_TYPE");

  const keys: Record<keyof Filters, string> = {
    query: "q",
    collection: "universe",
    category: "category",
    minimum: "min",
    maximum: "max",
    availability: "availability",
    type: "type",
  };

  const filters = Object.fromEntries(
    Object.entries(emptyFilters).map(([key, value]) => [
      key,
      params.get(keys[key as keyof Filters]) ?? value,
    ]),
  ) as unknown as Filters;

  if (collection) filters.collection = collection;
  if (productCategory) filters.category = productCategory;

  const sort = ["featured", "new", "low", "high", "name"].includes(
    params.get("sort") || "",
  )
    ? params.get("sort")!
    : "featured";

  // Active dropdown menu tracker: "universe" | "price" | "availability" | "type" | "sort" | null
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownsRef = useRef<HTMLDivElement>(null);

  // Local price fields for smooth custom range entry
  const [localMin, setLocalMin] = useState(filters.minimum);
  const [localMax, setLocalMax] = useState(filters.maximum);

  useEffect(() => {
    setLocalMin(filters.minimum);
    setLocalMax(filters.maximum);
  }, [filters.minimum, filters.maximum]);

  // Click outside and escape handling
  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownsRef.current &&
        !dropdownsRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  const navigate = (next: URLSearchParams, replace = false) => {
    const url = pathname + (next.size ? "?" + next.toString() : "");
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  };

  const change = (key: string, value: string, replace = false) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    navigate(next, replace);
  };

  const update = (key: keyof Filters, value: string) =>
    change(
      keys[key],
      value === emptyFilters[key] ? "" : value,
      key === "query",
    );

  const clear = () => navigate(new URLSearchParams());

  const arrivals = params.get("new") === "1";
  const source = store.pricedCatalogue.filter(
    (p) =>
      (!collection || p.collection === collection) &&
      (!productCategory || p.productCategory === productCategory) &&
      (!wishlist || store.wishlist.includes(p.id)) &&
      (!arrivals || p.isNew),
  );

  const items = discover(source, filters, sort);
  const paging = paginate(items, Number(params.get("page") || 1));

  useEffect(() => {
    if (params.has("page") && params.get("page") !== String(paging.page)) {
      const next = new URLSearchParams(params.toString());
      if (paging.page === 1) next.delete("page");
      else next.set("page", String(paging.page));
      window.history.replaceState(
        null,
        "",
        pathname + (next.size ? "?" + next.toString() : ""),
      );
    }
  }, [params, pathname, paging.page]);

  const go = (page: number) => {
    const next = new URLSearchParams(params.toString());
    if (page === 1) next.delete("page");
    else next.set("page", String(page));
    navigate(next);
  };

  // Distinct types and availability
  const distinctTypes = [...new Set(store.pricedCatalogue.map((p) => p.type))];

  const distinctAvailabilities = useMemo(
    () => [...new Set(products.map((p) => p.availability))],
    [],
  );

  // Franchise counts for Universe dropdown
  const universeCounts: Record<string, number> = { all: source.length };
  for (const c of collections) {
    universeCounts[c.slug] = source.filter((p) => p.collection === c.slug).length;
  }

  // Active filter checks
  const isCategoryActive = filters.category !== "all" && !productCategory;
  const isUniverseActive = filters.collection !== "all" && !collection;
  const isPriceActive = Boolean(filters.minimum || filters.maximum);
  const isAvailabilityActive = filters.availability !== "all";
  const isTypeActive = filters.type !== "all";
  const isSortActive = sort !== "featured";
  const isQueryActive = Boolean(filters.query);

  const hasAnyFilters =
    isCategoryActive ||
    isUniverseActive ||
    isPriceActive ||
    isAvailabilityActive ||
    isTypeActive ||
    isQueryActive;

  // Active filters list for chips display
  const activeChips = (
    Object.entries(filters) as [keyof Filters, string][]
  ).filter(
    ([key, value]) =>
      value !== emptyFilters[key] && !(key === "collection" && collection) && !(key === "category" && productCategory),
  );

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  // Price handler
  const applyCustomPrice = () => {
    const next = new URLSearchParams(params.toString());
    if (localMin) next.set("min", localMin);
    else next.delete("min");
    if (localMax) next.set("max", localMax);
    else next.delete("max");
    next.delete("page");
    navigate(next);
    setOpenDropdown(null);
  };

  const setPricePreset = (min: string, max: string) => {
    setLocalMin(min);
    setLocalMax(max);
    const next = new URLSearchParams(params.toString());
    if (min) next.set("min", min);
    else next.delete("min");
    if (max) next.set("max", max);
    else next.delete("max");
    next.delete("page");
    navigate(next);
    setOpenDropdown(null);
  };

  const clearPrice = () => {
    setLocalMin("");
    setLocalMax("");
    const next = new URLSearchParams(params.toString());
    next.delete("min");
    next.delete("max");
    next.delete("page");
    navigate(next);
    setOpenDropdown(null);
  };

  // Price button label
  const getPriceLabel = () => {
    if (!filters.minimum && !filters.maximum) return "Price Range";
    if (filters.minimum && !filters.maximum) return `৳${filters.minimum}+`;
    if (!filters.minimum && filters.maximum) return `Under ৳${filters.maximum}`;
    return `৳${filters.minimum}–৳${filters.maximum}`;
  };

  // Universe button label
  const getUniverseLabel = () => {
    if (filters.collection === "all") return "Universe";
    return (
      collections.find((c) => c.slug === filters.collection)?.name || "Universe"
    );
  };

  // Availability label
  const getAvailabilityLabel = () => {
    if (filters.availability === "all") return "Availability";
    return (
      availabilityLabel[filters.availability as keyof typeof availabilityLabel] ||
      filters.availability
    );
  };

  // Type label
  const getTypeLabel = () => {
    if (filters.type === "all") return "Type";
    return filters.type;
  };

  // Sort label
  const getSortLabel = () => {
    return sortOptions.find((o) => o.value === sort)?.label || "Featured";
  };

  const invalidRange =
    !!filters.minimum &&
    !!filters.maximum &&
    Number(filters.minimum) > Number(filters.maximum);

  return (
    <div className="catalog-experience">
      {/* Search Input Bar */}
      <div className="catalog-search-wrap">
        <Search size={18} className="catalog-search-icon" aria-hidden="true" />
        <input
          id="catalog-search"
          type="search"
          aria-label="Search products, characters and stories"
          className="catalog-search-input"
          placeholder="Search products, characters and stories (e.g. Luffy, Zoro, Ace)..."
          value={filters.query}
          onChange={(e) => update("query", e.target.value)}
        />
        {filters.query && (
          <button
            type="button"
            className="catalog-search-clear"
            aria-label="Clear search query"
            onClick={() => update("query", "")}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Luxury Horizontal Filter & Sort Bar */}
      <div className="catalog-bar" ref={dropdownsRef}>
        <div className="catalog-dropdowns-group">
          {!productCategory && <div className="catalog-dropdown">
            <button type="button" className={`catalog-dropdown-btn ${isCategoryActive ? "is-active" : ""}`} onClick={() => toggleDropdown("category")} aria-expanded={openDropdown === "category"} aria-haspopup="menu">
              <span>Category:</span><span className="catalog-btn-value">{productCategories.find(c => c.slug === filters.category)?.name || "All products"}</span><ChevronDown size={13} />
            </button>
            {openDropdown === "category" && <div className="catalog-dropdown-menu" role="menu" aria-label="Product categories"><div className="catalog-menu-header">Product category</div><div className="catalog-menu-list">
              {[{ slug: "all", name: "All products" }, ...productCategories].map(category => <button type="button" role="menuitem" className="catalog-menu-item" key={category.slug} onClick={() => { update("category", category.slug); setOpenDropdown(null); }}><span>{category.name}</span>{filters.category === category.slug && <Check size={14} />}</button>)}
            </div></div>}
          </div>}
          {/* 1. Universe / Collection Dropdown */}
          {!collection && (
            <div className="catalog-dropdown">
              <button
                type="button"
                className={`catalog-dropdown-btn ${
                  openDropdown === "universe" ? "is-open" : ""
                } ${isUniverseActive ? "is-active" : ""}`}
                onClick={() => toggleDropdown("universe")}
                aria-haspopup="menu"
                aria-expanded={openDropdown === "universe"}
              >
                {isUniverseActive && <span className="catalog-active-dot" />}
                <span>Universe:</span>
                <span className="catalog-btn-value">{getUniverseLabel()}</span>
                <ChevronDown size={13} className="catalog-btn-chevron" />
              </button>

              {openDropdown === "universe" && (
                <div className="catalog-dropdown-menu" role="menu">
                  <div className="catalog-menu-header">
                    <span>Franchise / Universe</span>
                    <small>Filter</small>
                  </div>
                  <div className="catalog-menu-list">
                    <button
                      type="button"
                      role="menuitem"
                      className={`catalog-menu-item ${
                        filters.collection === "all" ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        update("collection", "all");
                        setOpenDropdown(null);
                      }}
                    >
                      <span>All Universes</span>
                      <span className="catalog-item-meta">
                        <span className="catalog-item-count">
                          {universeCounts.all}
                        </span>
                        {filters.collection === "all" && (
                          <Check size={14} className="catalog-item-check" />
                        )}
                      </span>
                    </button>
                    {collections.map((c) => {
                      const isSelected = filters.collection === c.slug;
                      return (
                        <button
                          key={c.slug}
                          type="button"
                          role="menuitem"
                          className={`catalog-menu-item ${
                            isSelected ? "is-selected" : ""
                          }`}
                          onClick={() => {
                            update("collection", c.slug);
                            setOpenDropdown(null);
                          }}
                        >
                          <span>{c.name}</span>
                          <span className="catalog-item-meta">
                            <span className="catalog-item-count">
                              {universeCounts[c.slug] ?? 0}
                            </span>
                            {isSelected && (
                              <Check size={14} className="catalog-item-check" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Price Range Dropdown */}
          <div className="catalog-dropdown">
            <button
              type="button"
              className={`catalog-dropdown-btn ${
                openDropdown === "price" ? "is-open" : ""
              } ${isPriceActive ? "is-active" : ""}`}
              onClick={() => toggleDropdown("price")}
              aria-haspopup="dialog"
              aria-expanded={openDropdown === "price"}
            >
              {isPriceActive && <span className="catalog-active-dot" />}
              <span>Price:</span>
              <span className="catalog-btn-value">{getPriceLabel()}</span>
              <ChevronDown size={13} className="catalog-btn-chevron" />
            </button>

            {openDropdown === "price" && (
              <div className="catalog-dropdown-menu" role="dialog">
                <div className="catalog-price-panel">
                  <div className="catalog-menu-header">
                    <span>Price in BDT</span>
                    <small>Quick filter</small>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="catalog-price-presets">
                    <button
                      type="button"
                      className={`catalog-preset-btn ${
                        !filters.minimum && !filters.maximum ? "is-active" : ""
                      }`}
                      onClick={() => setPricePreset("", "")}
                    >
                      All Prices
                    </button>
                    <button
                      type="button"
                      className={`catalog-preset-btn ${
                        !filters.minimum && filters.maximum === "5000"
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() => setPricePreset("", "5000")}
                    >
                      Under ৳5,000
                    </button>
                    <button
                      type="button"
                      className={`catalog-preset-btn ${
                        filters.minimum === "5000" && filters.maximum === "7000"
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() => setPricePreset("5000", "7000")}
                    >
                      ৳5,000 – ৳7,000
                    </button>
                    <button
                      type="button"
                      className={`catalog-preset-btn ${
                        filters.minimum === "7000" && !filters.maximum
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() => setPricePreset("7000", "")}
                    >
                      ৳7,000+
                    </button>
                  </div>

                  {/* Custom range input */}
                  <div className="catalog-price-fields">
                    <div className="catalog-price-input-wrap">
                      <span className="catalog-price-prefix">৳</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        className="catalog-price-input"
                        value={localMin}
                        onChange={(e) => setLocalMin(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") applyCustomPrice();
                        }}
                      />
                    </div>
                    <span style={{ color: "var(--muted)" }}>—</span>
                    <div className="catalog-price-input-wrap">
                      <span className="catalog-price-prefix">৳</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        className="catalog-price-input"
                        value={localMax}
                        onChange={(e) => setLocalMax(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") applyCustomPrice();
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="catalog-price-actions">
                    <button
                      type="button"
                      className="catalog-price-btn-clear"
                      onClick={clearPrice}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="catalog-price-btn-apply"
                      onClick={applyCustomPrice}
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Availability Dropdown */}
          <div className="catalog-dropdown">
            <button
              type="button"
              className={`catalog-dropdown-btn ${
                openDropdown === "availability" ? "is-open" : ""
              } ${isAvailabilityActive ? "is-active" : ""}`}
              onClick={() => toggleDropdown("availability")}
              aria-haspopup="menu"
              aria-expanded={openDropdown === "availability"}
            >
              {isAvailabilityActive && <span className="catalog-active-dot" />}
              <span>Stock:</span>
              <span className="catalog-btn-value">{getAvailabilityLabel()}</span>
              <ChevronDown size={13} className="catalog-btn-chevron" />
            </button>

            {openDropdown === "availability" && (
              <div className="catalog-dropdown-menu" role="menu">
                <div className="catalog-menu-header">
                  <span>Stock Availability</span>
                  <small>Filter</small>
                </div>
                <div className="catalog-menu-list">
                  <button
                    type="button"
                    role="menuitem"
                    className={`catalog-menu-item ${
                      filters.availability === "all" ? "is-selected" : ""
                    }`}
                    onClick={() => {
                      update("availability", "all");
                      setOpenDropdown(null);
                    }}
                  >
                    <span>All demo states</span>
                    {filters.availability === "all" && (
                      <Check size={14} className="catalog-item-check" />
                    )}
                  </button>
                  {distinctAvailabilities.map((val) => {
                    const isSelected = filters.availability === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        role="menuitem"
                        className={`catalog-menu-item ${
                          isSelected ? "is-selected" : ""
                        }`}
                        onClick={() => {
                          update("availability", val);
                          setOpenDropdown(null);
                        }}
                      >
                        <span>
                          {availabilityLabel[val as keyof typeof availabilityLabel] ||
                            val}
                        </span>
                        {isSelected && (
                          <Check size={14} className="catalog-item-check" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Product Type Dropdown */}
          <div className="catalog-dropdown">
            <button
              type="button"
              className={`catalog-dropdown-btn ${
                openDropdown === "type" ? "is-open" : ""
              } ${isTypeActive ? "is-active" : ""}`}
              onClick={() => toggleDropdown("type")}
              aria-haspopup="menu"
              aria-expanded={openDropdown === "type"}
            >
              {isTypeActive && <span className="catalog-active-dot" />}
              <span>Type:</span>
              <span className="catalog-btn-value">{getTypeLabel()}</span>
              <ChevronDown size={13} className="catalog-btn-chevron" />
            </button>

            {openDropdown === "type" && (
              <div className="catalog-dropdown-menu" role="menu">
                <div className="catalog-menu-header">
                  <span>Product Type</span>
                  <small>Filter</small>
                </div>
                <div className="catalog-menu-list">
                  <button
                    type="button"
                    role="menuitem"
                    className={`catalog-menu-item ${
                      filters.type === "all" ? "is-selected" : ""
                    }`}
                    onClick={() => {
                      update("type", "all");
                      setOpenDropdown(null);
                    }}
                  >
                    <span>All types</span>
                    {filters.type === "all" && (
                      <Check size={14} className="catalog-item-check" />
                    )}
                  </button>
                  {distinctTypes.map((t) => {
                    const isSelected = filters.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="menuitem"
                        className={`catalog-menu-item ${
                          isSelected ? "is-selected" : ""
                        }`}
                        onClick={() => {
                          update("type", t);
                          setOpenDropdown(null);
                        }}
                      >
                        <span>{t}</span>
                        {isSelected && (
                          <Check size={14} className="catalog-item-check" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. Sort By Dropdown */}
          <div className="catalog-dropdown">
            <button
              type="button"
              className={`catalog-dropdown-btn ${
                openDropdown === "sort" ? "is-open" : ""
              } ${isSortActive ? "is-active" : ""}`}
              onClick={() => toggleDropdown("sort")}
              aria-haspopup="menu"
              aria-expanded={openDropdown === "sort"}
            >
              <span>Sort:</span>
              <span className="catalog-btn-value">{getSortLabel()}</span>
              <ChevronDown size={13} className="catalog-btn-chevron" />
            </button>

            {openDropdown === "sort" && (
              <div className="catalog-dropdown-menu" role="menu">
                <div className="catalog-menu-header">
                  <span>Sort Catalog</span>
                  <small>Order</small>
                </div>
                <div className="catalog-menu-list">
                  {sortOptions.map((opt) => {
                    const isSelected = sort === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitem"
                        className={`catalog-menu-item ${
                          isSelected ? "is-selected" : ""
                        }`}
                        onClick={() => {
                          change("sort", opt.value);
                          setOpenDropdown(null);
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <Check size={14} className="catalog-item-check" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reset All Filters button if any active */}
          {hasAnyFilters && (
            <button
              type="button"
              className="catalog-reset-btn"
              onClick={clear}
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Results Count Text */}
        <span className="catalog-status-text" role="status">
          Showing {paging.from}–{paging.to} of {paging.total} products
        </span>
      </div>

      {/* Active Filter Chips Bar */}
      {activeChips.length > 0 && (
        <div className="catalog-chips-row" aria-label="Active filters">
          {activeChips.map(([key, value]) => {
            const label =
              key === "category" ? productCategories.find(category => category.slug === value)?.name || value : key === "collection"
                ? collections.find((c) => c.slug === value)?.name || value
                : key === "availability"
                  ? availabilityLabel[value as keyof typeof availabilityLabel] || value
                  : key === "minimum"
                    ? `Min: ৳${value}`
                    : key === "maximum"
                      ? `Max: ৳${value}`
                      : key === "query"
                        ? `Search: "${value}"`
                        : `${key}: ${value}`;

            return (
              <button
                key={key}
                type="button"
                className="catalog-chip"
                onClick={() => update(key, emptyFilters[key])}
                aria-label={`Remove filter: ${label}`}
              >
                <span>{label}</span>
                <X size={12} />
              </button>
            );
          })}
          <button
            type="button"
            className="catalog-chips-clear-all"
            onClick={clear}
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Invalid Price Warning */}
      {invalidRange && (
        <p className="feedback" role="alert" style={{ margin: "10px 0" }}>
          Minimum price must not exceed maximum price.
        </p>
      )}

      {/* Full-width Product Grid Layout */}
      <div className="catalog-full-layout">
        {items.length ? (
          <ProductGrid products={paging.items} />
        ) : (
          <div className="empty-state">
            <h2>
              {wishlist && source.length === 0
                ? "Keep your favourites close."
                : arrivals
                  ? "No verified new arrivals yet."
                  : "No products in this view."}
            </h2>
            <p>
              {wishlist && source.length === 0
                ? "Tap the heart on a figure to save it here."
                : productCategory && source.length === 0 ? "No products have been added to this category yet. Explore another category or ask HIMATU about an item." : "Try another character, a wider price range, or fewer filters."}
            </p>
            {productCategory && source.length === 0 ? <Link href="/categories" className="button button--outline">BROWSE OTHER CATEGORIES</Link> : <Button variant="outline" onClick={clear}>CLEAR ALL FILTERS</Button>}
          </div>
        )}

        {/* Pagination */}
        {items.length > 0 && paging.pages > 1 && (
          <nav className="pagination" aria-label="Catalogue pages" style={{ marginTop: "40px" }}>
            <button
              disabled={paging.page === 1}
              onClick={() => go(paging.page - 1)}
            >
              Previous
            </button>
            <div>
              {Array.from({ length: paging.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  aria-label={`Page ${page}`}
                  aria-current={page === paging.page ? "page" : undefined}
                  onClick={() => go(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              disabled={paging.page === paging.pages}
              onClick={() => go(paging.page + 1)}
            >
              Next
            </button>
          </nav>
        )}

        <DemoNotice>
          HIMATU originals and source-attributed product photographs. New reference listings are available for enquiries; confirm stock, edition and final pricing with our team.
        </DemoNotice>
      </div>
    </div>
  );
}

export function ProductCatalog(props: Parameters<typeof CatalogContent>[0]) {
  return (
    <Suspense fallback={<p role="status">Loading catalogue…</p>}>
      <CatalogContent {...props} />
    </Suspense>
  );
}
