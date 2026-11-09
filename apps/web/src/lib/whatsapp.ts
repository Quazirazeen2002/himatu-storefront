export const OWNER_WHATSAPP = "8801797725697";
export const whatsappLink = (message: string) => `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
const money = (amount: number) => `BDT ${new Intl.NumberFormat("en-BD").format(amount)}`;
const clean = (value: string) => value.replace(/[\u0000-\u001f]/g, " ").trim();
export interface WhatsAppOrder {
  customer: { fullName: string; email: string; phone: string; address: string; area: string; district: string; postalCode: string; orderNotes: string };
  items: { name: string; character: string; quantity: number; unitPrice: number; demoPrice?: boolean; slug: string }[];
  subtotal: number; discount: number; shipping: number; total: number;
  shippingMethod: string; paymentMethod: string; origin: string;
}
export function formatWhatsAppOrder(order: WhatsAppOrder) {
  const c = order.customer;
  return [
    "*HIMATU — ORDER REQUEST*", "Your fandom. Your collection.", "",
    "*COLLECTIBLES*",
    ...order.items.flatMap((item, index) => [
      `${index + 1}. *${clean(item.name)}*`,
      `Character: ${clean(item.character)}`,
      `Qty: ${item.quantity} × ${money(item.unitPrice)} = ${money(item.unitPrice * item.quantity)}${item.demoPrice ? " (DEMO PRICE)" : ""}`,
      `${order.origin}/products/${encodeURIComponent(item.slug)}`, "",
    ]),
    "*ORDER SUMMARY*", `Subtotal: ${money(order.subtotal)}`,
    ...(order.discount ? [`Extra discount: −${money(order.discount)}`] : []),
    `Delivery estimate: ${money(order.shipping)}`, `*Estimated total: ${money(order.total)}*`, "",
    ...(order.items.some(item => item.demoPrice) ? ["Includes demo prices for preview. Please confirm final selling prices before payment.", ""] : []),
    "*CUSTOMER*", `Name: ${clean(c.fullName)}`, `Phone: ${clean(c.phone)}`, `Email: ${clean(c.email)}`, "",
    "*DELIVERY*", clean(c.address), `${clean(c.area)}, ${clean(c.district)}`,
    ...(c.postalCode.trim() ? [`Postal code: ${clean(c.postalCode)}`] : []),
    `Delivery preference: ${clean(order.shippingMethod)}`, `Payment preference: ${clean(order.paymentMethod)}`, "",
    ...(c.orderNotes.trim() ? ["*SPECIAL INSTRUCTIONS*", clean(c.orderNotes), ""] : []),
    "Please confirm availability, final pricing, delivery charge and payment arrangements before processing. This message is an order request; no payment has been made.",
  ].join("\n");
}
