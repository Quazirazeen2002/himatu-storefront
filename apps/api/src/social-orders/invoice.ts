export interface InvoiceSnapshot {
  number: string;
  date: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    area: string;
    district: string;
  };
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
}
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const money = (n: number) => `BDT ${Number(n).toLocaleString("en-BD")}`;
export function invoiceHtml(s: InvoiceSnapshot): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Invoice ${escape(s.number)}</title></head><body style="margin:0;background:#f4f4f4;color:#171717;font-family:Arial,sans-serif"><main style="max-width:760px;margin:30px auto;background:#fff;padding:32px"><header style="border-bottom:3px solid #171717;padding-bottom:24px"><strong style="font-size:30px;letter-spacing:2px">HIMATU</strong><p>INVOICE · ${escape(s.number)}</p><p>Issued ${escape(s.date)} · ${escape(s.paymentStatus === "PAID" ? "Paid" : "Payment pending")}</p></header><section style="padding:24px 0"><h2 style="font-size:13px;color:#666">BILL TO / DELIVER TO</h2><strong>${escape(s.customer.fullName)}</strong><p>${escape(s.customer.email)}<br>${escape(s.customer.phone)}</p><p>${escape(s.customer.address)}<br>${escape(s.customer.area)}, ${escape(s.customer.district)}</p></section><table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr style="background:#171717;color:#fff"><th style="text-align:left;padding:12px">Collectible</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${s.items.map((i) => `<tr><td style="padding:16px 8px;border-bottom:1px solid #ddd">${escape(i.productName)}</td><td>${i.quantity}</td><td>${money(i.unitPrice)}</td><td>${money(i.lineTotal)}</td></tr>`).join("")}</tbody></table><section style="margin:24px 0 24px auto;max-width:320px"><p>Subtotal: ${money(s.subtotal)}</p><p>Delivery: ${money(s.shippingCharge)}</p><p>Discount: ${money(s.discountAmount)}</p><p style="border-top:2px solid #171717;padding-top:16px;font-size:22px"><strong>Total: ${money(s.totalAmount)}</strong></p></section><footer style="border-top:1px solid #ddd;padding-top:20px;color:#555;font-size:12px">Thank you for collecting with HIMATU.<br>Order support: 01714546809<br>This invoice records the reviewed order. A pending payment status is not proof of payment.</footer></main></body></html>`;
}
