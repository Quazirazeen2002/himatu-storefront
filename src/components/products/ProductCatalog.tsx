"use client";
import { useState, useId, Suspense, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { catalogue } from "@/lib/catalogue";
import { SlidersHorizontal, X } from "lucide-react";
import { collections, products, availabilityLabel } from "@/lib/config";
import {
  discover,
  emptyFilters,
  paginate,
  type Filters,
} from "@/lib/discovery";
import { ProductGrid } from "./ProductCard";
import { Button, DemoNotice, Input, Select } from "../ui/Primitives";
import { Modal } from "../ui/Modal";
import { useStore } from "../commerce/StoreProvider";
function FilterFields({
  filters,
  update,
  locked,
}: {
  filters: Filters;
  update: (key: keyof Filters, value: string) => void;
  locked: boolean;
}) {
  const id = useId();
  return (
    <>
      <Select
        id={`${id}-universe`}
        label="Universe"
        value={filters.collection}
        disabled={locked}
        onChange={(e) => update("collection", e.target.value)}
      >
        <option value="all">All universes</option>
        {collections.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </Select>
      <div className="form-row">
        <Input
          id={`${id}-min`}
          label="Minimum price (BDT)"
          type="number"
          min="0"
          value={filters.minimum}
          onChange={(e) => update("minimum", e.target.value)}
        />
        <Input
          id={`${id}-max`}
          label="Maximum price (BDT)"
          type="number"
          min="0"
          value={filters.maximum}
          onChange={(e) => update("maximum", e.target.value)}
        />
      </div>
      <Select
        id={`${id}-availability`}
        label="Demo availability"
        value={filters.availability}
        onChange={(e) => update("availability", e.target.value)}
      >
        <option value="all">All demo states</option>
        {[...new Set(products.map((p) => p.availability))].map((value) => (
          <option key={value} value={value}>
            {availabilityLabel[value]}
          </option>
        ))}
      </Select>
      <Select
        id={`${id}-type`}
        label="Product type"
        value={filters.type}
        onChange={(e) => update("type", e.target.value)}
      >
        <option value="all">All types</option>
        {[...new Set(catalogue.map((p) => p.type))].map((type) => (
          <option key={type}>{type}</option>
        ))}
      </Select>
    </>
  );
}
function CatalogContent({
  collection,
  wishlist = false,
}: {
  collection?: string;
  wishlist?: boolean;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const keys: Record<keyof Filters, string> = {
    query: "q",
    collection: "universe",
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
  const sort = ["featured", "new", "low", "high", "name"].includes(
    params.get("sort") || "",
  )
    ? params.get("sort")!
    : "featured";
  const [open, setOpen] = useState(false);
  const store = useStore();
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
  const source = catalogue.filter(
    (p) =>
      (!collection || p.collection === collection) &&
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
  const active = (Object.entries(filters) as [keyof Filters, string][]).filter(
    ([key, value]) =>
      value !== emptyFilters[key] && !(key === "collection" && collection),
  );
  const invalidRange =
    !!filters.minimum &&
    !!filters.maximum &&
    Number(filters.minimum) > Number(filters.maximum);
  return (
    <>
      <div className="discovery-search">
        <Input
          id="catalog-search"
          label="Search figures, characters and stories"
          type="search"
          placeholder="Try Luffy, Zoro, Ace or Sanji"
          value={filters.query}
          onChange={(e) => update("query", e.target.value)}
        />
        {filters.query && (
          <Button variant="text" onClick={() => update("query", "")}>
            Clear search
          </Button>
        )}
      </div>
      <div className="catalog-toolbar">
        <span role="status">
          Showing {paging.from}–{paging.to} of {paging.total}
        </span>
        <div>
          <Button
            variant="outline"
            className="button button--outline filter-trigger"
            onClick={() => setOpen(true)}
          >
            <SlidersHorizontal size={15} />
            Filters {active.length > 0 && `(${active.length})`}
          </Button>
          <Select
            id="sort"
            label="Sort by"
            value={sort}
            onChange={(e) => change("sort", e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="new">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name: A to Z</option>
          </Select>
        </div>
      </div>
      {active.length > 0 && (
        <div className="active-filters" aria-label="Active filters">
          {active.map(([key, value]) => (
            <button
              key={key}
              onClick={() => update(key, emptyFilters[key])}
              aria-label={`Remove ${key} filter`}
            >
              {key === "collection"
                ? collections.find((c) => c.slug === value)?.name
                : key === "availability"
                  ? availabilityLabel[value as keyof typeof availabilityLabel]
                  : `${key}: ${value}`}
              <X size={13} />
            </button>
          ))}
          <button className="clear-filters" onClick={clear}>
            Clear all filters
          </button>
        </div>
      )}
      <div className="discovery-layout">
        <aside className="desktop-filters">
          <h2>Refine your collection</h2>
          <FilterFields
            filters={filters}
            update={update}
            locked={!!collection}
          />
          <Button variant="text" onClick={clear}>
            Clear all filters
          </Button>
        </aside>
        <div>
          {invalidRange && (
            <p className="feedback" role="alert">
              Minimum price must not exceed maximum price.
            </p>
          )}
          {items.length ? (
            <ProductGrid products={paging.items} />
          ) : (
            <div className="empty-state">
              <h2>
                {wishlist && source.length === 0
                  ? "Keep your favourites close."
                  : arrivals
                    ? "No verified new arrivals yet."
                    : "No figures in this view."}
              </h2>
              <p>
                {wishlist && source.length === 0
                  ? "Tap the heart on a figure to save it here."
                  : "Try another character, a wider price range, or fewer filters."}
              </p>
              <Button variant="outline" onClick={clear}>
                CLEAR ALL FILTERS
              </Button>
            </div>
          )}
          {items.length > 0 && (
            <nav className="pagination" aria-label="Catalogue pages">
              <button
                disabled={paging.page === 1}
                onClick={() => go(paging.page - 1)}
              >
                Previous
              </button>
              <div>
                {Array.from({ length: paging.pages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      aria-label={`Page ${page}`}
                      aria-current={page === paging.page ? "page" : undefined}
                      onClick={() => go(page)}
                    >
                      {page}
                    </button>
                  ),
                )}
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
            Original Himatu photography with sample prices; AI concepts are
            labelled and not for sale. Availability states demonstrate the
            interface and do not represent actual stock.
          </DemoNotice>
        </div>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Filter figures"
        className="filter-modal"
      >
        <FilterFields filters={filters} update={update} locked={!!collection} />
        <Button variant="text" onClick={clear}>
          Clear all filters
        </Button>
        <Button onClick={() => setOpen(false)}>
          SHOW {items.length} RESULTS
        </Button>
      </Modal>
    </>
  );
}

export function ProductCatalog(props: Parameters<typeof CatalogContent>[0]) {
  return (
    <Suspense fallback={<p role="status">Loading catalogue…</p>}>
      <CatalogContent {...props} />
    </Suspense>
  );
}
