"use client";
import Link from "next/link";
import { Heart, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useStore } from "./StoreProvider";
import { products, formatPrice } from "@/lib/config";
import { Button, ButtonLink, DemoNotice, IconButton } from "../ui/Primitives";
import { AssetImage } from "../products/AssetImage";
import { assets } from "@/lib/assets";
import { getTotals } from "@/lib/demo-store";
export function WishlistButton({ id }: { id: string }) {
  const store = useStore();
  const selected = store.wishlist.includes(id);
  return (
    <IconButton
      label={selected ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={selected}
      onClick={() => store.toggleWish(id)}
    >
      <Heart size={19} fill={selected ? "currentColor" : "none"} />
    </IconButton>
  );
}
export function QuantitySelector({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (q: number) => void;
}) {
  return (
    <div className="quantity">
      <IconButton
        label="Decrease quantity"
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus size={15} />
      </IconButton>
      <span aria-live="polite">{quantity}</span>
      <IconButton
        label="Increase quantity"
        disabled={quantity >= 10}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={15} />
      </IconButton>
    </div>
  );
}
export function AddToBag({ id }: { id: string }) {
  const store = useStore();
  return (
    <Button
      onClick={() => {
        store.setQuantity(id, (store.bag[id] || 0) + 1);
        store.setDrawer("bag");
      }}
    >
      ADD TO BAG <Plus size={17} />
    </Button>
  );
}
export function OrderSummary({
  checkoutLink = true,
}: {
  checkoutLink?: boolean;
}) {
  const { bag, storageAvailable } = useStore();
  const { subtotal: total, count } = getTotals(bag);
  return (
    <aside className="order-summary">
      <h2>Summary</h2>
      <p className="eyebrow">{count} ITEMS</p>
      <div className="summary-line">
        <span>Subtotal</span>
        <strong>{formatPrice(total)}</strong>
      </div>
      <div className="summary-line">
        <span>Delivery</span>
        <span>Calculated at checkout</span>
      </div>
      <hr />
      <div className="summary-line">
        <strong>Items total</strong>
        <strong>{formatPrice(total)}</strong>
      </div>
      {checkoutLink && (
        <ButtonLink href="/checkout">PROCEED TO CHECKOUT</ButtonLink>
      )}
      {!storageAvailable && (
        <p className="storage-note" role="status">
          Browser storage is unavailable. Your selections may not survive a
          refresh.
        </p>
      )}
    </aside>
  );
}
export function BagItems() {
  const store = useStore();
  const items = products.filter((p) => store.bag[p.id] > 0);
  if (!items.length)
    return (
      <div className="empty-state">
        <ShoppingBag size={36} strokeWidth={1} />
        <h2>A little room for your fandom.</h2>
        <p>Your shopping bag is empty. Explore our collection.</p>
        <div onClick={() => store.setDrawer(null)}>
          <ButtonLink href="/shop">EXPLORE FIGURES</ButtonLink>
        </div>
      </div>
    );
  return (
    <div
      className="bag-items"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) store.setDrawer(null);
      }}
    >
      {items.map((p) => (
        <article className="bag-item" key={p.id}>
          <Link href={`/products/${p.id}`} className="bag-image">
            <AssetImage asset={assets.product(p)} sizes="120px" />
          </Link>
          <div>
            <p className="eyebrow">{p.franchise}</p>
            <h3>
              <Link href={`/products/${p.id}`}>{p.name}</Link>
            </h3>
            <p>
              {formatPrice(p.price)}{" "}
              <span className="muted">· Sample price</span>
            </p>
            <QuantitySelector
              quantity={store.bag[p.id]}
              onChange={(q) => store.setQuantity(p.id, q)}
            />
          </div>
          <IconButton
            label={`Remove ${p.name} from bag`}
            onClick={() => store.setQuantity(p.id, 0)}
          >
            <Trash2 size={17} />
          </IconButton>
        </article>
      ))}
    </div>
  );
}
