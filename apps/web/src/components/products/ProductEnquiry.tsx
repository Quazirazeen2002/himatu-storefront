"use client";
import { useState } from "react";
import { useStore } from "../commerce/StoreProvider";
import { Button } from "../ui/Primitives";
import { WishlistButton, QuantitySelector } from "../commerce/Commerce";
import type { ReferenceProduct } from "@/lib/types";
import { MessageCircle, ArrowUpRight, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/config";
import { whatsappLink } from "@/lib/whatsapp";
export function ProductEnquiry({ product, onAdded }: { product: ReferenceProduct; onAdded?: () => void }) {
  const store = useStore();
  const [quantity, setQuantity] = useState(1);
  const remaining = 10 - (store.bag[product.id] || 0);
  return <div className="product-enquiry">
    <div className="reference-cart-actions"><QuantitySelector quantity={quantity} onChange={setQuantity} /><Button disabled={quantity > remaining} onClick={() => {
      store.setQuantity(product.id, (store.bag[product.id] || 0) + quantity);
      onAdded?.();
      store.setDrawer("bag");
    }}><ShoppingBag size={18} /> ADD TO CART</Button></div>
    {quantity > remaining && <p className="feedback">Maximum 10 units per item. Adjust the quantity or your bag.</p>}
    <a className="button button--outline" href={whatsappLink(`Hello HIMATU! I'm interested in ${product.name}.\nCharacter: ${product.character}\nCollection: ${product.franchise}\nQuantity: ${quantity}\nUnit price: ${formatPrice(product.price)}\nSource: ${product.source.page}\nPlease confirm whether you can supply this item, its BDT price and delivery options.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> ASK HIMATU ON WHATSAPP</a>
    <a className="text-link" href={product.source.page} target="_blank" rel="noopener noreferrer">PHOTO SOURCE · {product.source.label.toUpperCase()} <ArrowUpRight size={14} /></a>
    <div className="enquiry-wishlist"><WishlistButton id={product.id} /><span>Save this item for later</span></div>
  </div>;
}
