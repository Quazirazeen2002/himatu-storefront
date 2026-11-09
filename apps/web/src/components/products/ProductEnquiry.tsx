import { WishlistButton } from "../commerce/Commerce";
import type { ReferenceProduct } from "@/lib/types";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
export function ProductEnquiry({ product }: { product: ReferenceProduct }) {
  return <div className="product-enquiry">
    <p>Found your next favourite? Ask us about sourcing, pricing and availability.</p>
    <a className="button button--primary" href={whatsappLink(`Hello HIMATU! I'm interested in ${product.name}.\nCharacter: ${product.character}\nCollection: ${product.franchise}\nSource: ${product.source.page}\nPlease confirm whether you can supply this item, its BDT price and delivery options.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> ASK HIMATU ON WHATSAPP</a>
    <a className="text-link" href={product.source.page} target="_blank" rel="noopener noreferrer">PHOTO SOURCE · {product.source.label.toUpperCase()} <ArrowUpRight size={14} /></a>
    <div className="enquiry-wishlist"><WishlistButton id={product.id} /><span>Save this item for later</span></div>
    <small>Reference listing. Price and HIMATU stock await confirmation; this item cannot be added to the bag yet.</small>
  </div>;
}
