"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FigureProduct } from "@/lib/types";
import { useStore } from "./StoreProvider";
import { QuantitySelector, WishlistButton } from "./Commerce";
import { Button } from "../ui/Primitives";
export function ProductActions({ product }: { product: FigureProduct }) {
  const [quantity, setQuantity] = useState(1);
  const store = useStore();
  const router = useRouter();
  const sold = product.availability === "sold-out";
  const remaining = 10 - (store.bag[product.id] || 0);
  const add = (buy = false) => {
    store.setQuantity(product.id, (store.bag[product.id] || 0) + quantity);
    if (buy) router.push("/checkout");
    else store.setDrawer("bag");
  };
  return (
    <div className="product-actions">
      <p className="eyebrow">QUANTITY</p>
      <QuantitySelector quantity={quantity} onChange={setQuantity} />
      <div className="detail-actions">
        <Button
          disabled={sold || remaining === 0 || quantity > remaining}
          onClick={() => add()}
        >
          {sold
            ? "SOLD OUT"
            : product.availability === "pre-order"
              ? "PRE-ORDER COLLECTIBLE"
              : "ADD TO BAG"}
        </Button>
        <WishlistButton id={product.id} />
      </div>
      <Button
        variant="outline"
        disabled={sold || remaining === 0 || quantity > remaining}
        onClick={() => add(true)}
      >
        BUY NOW · PROCEED TO CHECKOUT
      </Button>
      {quantity > remaining && !sold && (
        <p className="feedback">
          Maximum 10 units per collectible order. Please adjust quantity.
        </p>
      )}
      <p className="demo-note">
        Insured double-walled courier delivery with corner protection across Bangladesh.
      </p>
    </div>
  );
}
