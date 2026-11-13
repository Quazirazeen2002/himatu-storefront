import { videoSocialLinks } from "./social-links";
export const OWNER_INSTAGRAM = "himatuofficial";
export const instagramOrderLink = () => `https://ig.me/m/${OWNER_INSTAGRAM}`;
export const OWNER_WHATSAPP = "8801714546809";
export const whatsappLink = (message: string) => `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
const money = (amount: number) => `BDT ${new Intl.NumberFormat("en-BD").format(amount)}`;
const clean = (value: string) => value.replace(/[\u0000-\u001f]/g, " ").trim();
export interface WhatsAppOrder {
  customer: { fullName: string; email: string; phone: string; address: string; area: string; district: string; postalCode: string; orderNotes: string };
  items: { name: string; character: string; quantity: number; unitPrice: number; slug: string }[];
  subtotal: number; discount: number; shipping: number; total: number;
  discountLabel?: string; shippingPending?: boolean; shippingMethod?: string; paymentMethod?: string; origin: string;
}
export function formatWhatsAppOrder(order: WhatsAppOrder) {
  const c = order.customer;
  return [
    "*HIMATU — ORDER REQUEST*", "Your fandom. Your collection.", "",
    "*COLLECTIBLES*",
    ...order.items.flatMap((item, index) => [
      `${index + 1}. *${clean(item.name)}*`,
      `Character: ${clean(item.character)}`,
      `Qty: ${item.quantity} × ${money(item.unitPrice)} = ${money(item.unitPrice * item.quantity)}`,
      `${order.origin}/products/${encodeURIComponent(item.slug)}`, "",
    ]),
    "*ORDER SUMMARY*", `Subtotal: ${money(order.subtotal)}`,
    ...(order.discount ? [`${order.discountLabel || "Extra discount"}: −${money(order.discount)}`] : []),
    order.shippingPending ? "Delivery: arranged with HIMATU" : `Delivery estimate: ${money(order.shipping)}`, `*${order.shippingPending ? "Items estimate" : "Estimated total"}: ${money(order.total)}*`, "",
    "*CUSTOMER*", `Name: ${clean(c.fullName)}`, `Phone: ${clean(c.phone)}`, `Email: ${clean(c.email)}`, "",
    "*DELIVERY*", clean(c.address), `${clean(c.area)}, ${clean(c.district)}`,
    ...(c.postalCode.trim() ? [`Postal code: ${clean(c.postalCode)}`] : []),
    ...(order.shippingMethod ? [`Delivery preference: ${clean(order.shippingMethod)}`] : []), ...(order.paymentMethod ? [`Payment preference: ${clean(order.paymentMethod)}`] : []), "",
    ...(c.orderNotes.trim() ? ["*SPECIAL INSTRUCTIONS*", clean(c.orderNotes), ""] : []),
    "*FOLLOW HIMATU*", ...videoSocialLinks.map(link => `${link.name}: ${link.href}`),
  ].join("\n");
}
