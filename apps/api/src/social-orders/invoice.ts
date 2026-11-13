import PDFDocument from "pdfkit";
import { invoiceLogo } from "./invoice-logo";
export interface InvoiceSnapshot {
  number: string;
  date: string;
  customer: { fullName: string; email: string; phone: string; address: string; area: string; district: string };
  items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
}
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const money = (n: number) => `Tk ${Number(n).toLocaleString("en-BD", {minimumFractionDigits:2, maximumFractionDigits:2})}`;
const amountDue = (s: InvoiceSnapshot) => s.paymentStatus === "PAID" ? 0 : s.totalAmount;
export function invoiceHtml(s: InvoiceSnapshot): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Invoice ${escape(s.number)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f4f4;color:#171717;font:14px Arial,sans-serif}main{max-width:850px;margin:24px auto;background:#fff;padding:64px 48px}header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;min-height:180px}h1{font-size:30px;margin:0 0 28px;letter-spacing:-1px}h2{font-size:20px;margin:0 0 8px}p{line-height:1.6;margin:0;color:#606060}header img{width:160px;max-width:35%;height:auto}.bill{display:flex;justify-content:space-between;gap:20px;border:1px solid #e5e5e5;border-radius:6px;padding:20px;margin:28px 0 32px}.label{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.6px}.bill strong{display:block;font-size:18px;margin:10px 0}.meta{min-width:230px}.meta div{display:flex;justify-content:space-between;gap:20px;margin-bottom:15px}table{border-collapse:collapse;width:100%;font-size:13px}th{text-align:right;background:#f3f3f3;padding:12px 8px;font-size:10px;text-transform:uppercase}th:first-child,td:first-child{text-align:left}td{text-align:right;padding:20px 8px;vertical-align:top;border-bottom:1px solid #f2f2f2}td:first-child{width:46%;font-weight:600}.totals{margin:32px 0 0 auto;width:50%;min-width:250px}.totals div{display:flex;justify-content:space-between;gap:20px;padding:10px 0}.total{border-top:1px solid #e5e5e5}.due{font-size:20px;font-weight:bold;margin-top:24px}.discount{color:#15803d}footer{margin-top:70px;font-size:12px;color:#606060}@media(max-width:560px){main{padding:24px 16px}.bill{display:block}.meta{margin-top:24px;min-width:0}header{min-height:150px}header img{width:110px}td{padding:16px 4px}.totals{width:100%;min-width:0}}@media print{@page{size:A4;margin:15mm}body{background:white}main{margin:0;padding:0;max-width:none}thead{display:table-header-group}tr,.bill,.totals{break-inside:avoid}footer{break-inside:avoid}}
</style></head><body><main><header><div><h1>INVOICE</h1><h2>HIMATU</h2><p>Anime figures &amp; collectibles<br>himatu.com<br>01714546809</p></div><img src="data:image/png;base64,${invoiceLogo}" alt="HIMATU logo"></header><section class="bill"><div><span class="label">Bill to</span><strong>${escape(s.customer.fullName)}</strong><p>${escape(s.customer.address)}<br>${escape(s.customer.area)}, ${escape(s.customer.district)}<br>${escape(s.customer.phone)}<br>${escape(s.customer.email)}</p></div><div class="meta"><div><span class="label">Invoice number</span><span>${escape(s.number)}</span></div><div><span class="label">Issued</span><span>${escape(s.date)}</span></div><div><span class="label">Payment</span><span>${s.paymentStatus === "PAID" ? "Paid" : "Pending"}</span></div></div></section><table><thead><tr><th>Item</th><th>Price</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>${s.items.map(i=>`<tr><td>${escape(i.productName)}</td><td>${money(i.unitPrice)}</td><td>${i.quantity}</td><td>${money(i.lineTotal)}</td></tr>`).join("")}</tbody></table><section class="totals"><div><span>Subtotal</span><span>${money(s.subtotal)}</span></div>${s.shippingCharge ? `<div><span>Delivery charge</span><span>${money(s.shippingCharge)}</span></div>` : ""}${s.discountAmount ? `<div class="discount"><span>Order discount</span><span>−${money(s.discountAmount)}</span></div>` : ""}<div class="total"><span>Total</span><span>${money(s.totalAmount)}</span></div><div class="due"><span>Amount due</span><span>${money(amountDue(s))}</span></div></section><footer>Thank you for choosing HIMATU.</footer></main></body></html>`;
}
/** A4 document with repeated table headers and page-safe totals for large orders. */
export function invoicePdf(s: InvoiceSnapshot): Promise<Buffer> {
  return new Promise((resolve,reject) => {
    const doc = new PDFDocument({size:"A4",margin:44,bufferPages:true,info:{Title:`HIMATU Invoice ${s.number}`,Author:"HIMATU"}});
    const chunks:Buffer[]=[];doc.on("data",chunk=>chunks.push(chunk));doc.on("end",()=>resolve(Buffer.concat(chunks)));doc.on("error",reject);
    const right=551,width=507;
    const text=(value:string,x:number,y:number,w:number,size=10,bold=false,align:"left"|"right"="left")=>{doc.font(bold?"Helvetica-Bold":"Helvetica").fontSize(size).fillColor("#171717").text(value,x,y,{width:w,align});};
    text("INVOICE",44,50,280,27,true);text("HIMATU",44,100,280,17,true);
    text("Anime figures & collectibles\nhimatu.com\n01714546809",44,127,280,10);
    doc.image(Buffer.from(invoiceLogo,"base64"),405,50,{fit:[140,115]});
    const address=[s.customer.fullName,s.customer.address,`${s.customer.area}, ${s.customer.district}`,s.customer.phone,s.customer.email].filter(Boolean).join("\n");
    doc.font("Helvetica").fontSize(10);const billHeight=Math.max(110,doc.heightOfString(address,{width:265})+45);
    doc.roundedRect(44,207,width,billHeight,4).strokeColor("#e5e5e5").stroke();text("BILL TO",58,223,265,9,true);text(address,58,243,265,10);
    text("INVOICE NUMBER",355,223,100,8,true);text(s.number,448,223,89,9,false,"right");
    text("ISSUED",355,253,100,8,true);text(s.date,440,253,97,9,false,"right");
    text("PAYMENT",355,280,100,8,true);text(s.paymentStatus==="PAID"?"Paid":"Pending",440,280,97,9,false,"right");
    let y=207+billHeight+30;
    const tableHeader=()=>{doc.rect(44,y,width,27).fill("#f3f3f3");text("ITEM",52,y+9,240,9,true);text("PRICE",296,y+9,80,9,true,"right");text("QTY",382,y+9,42,9,true,"right");text("AMOUNT",430,y+9,113,9,true,"right");y+=27;};tableHeader();
    for(const item of s.items){doc.font("Helvetica-Bold").fontSize(10);const h=Math.max(54,doc.heightOfString(item.productName,{width:232})+28);
      if(y+h>735){doc.addPage();y=50;tableHeader();}
      text(item.productName,52,y+14,232,10,true);text(money(item.unitPrice),290,y+14,86,10,false,"right");text(String(item.quantity),382,y+14,42,10,false,"right");text(money(item.lineTotal),430,y+14,113,10,false,"right");y+=h;doc.moveTo(44,y).lineTo(right,y).strokeColor("#eeeeee").stroke();
    }
    const totalHeight=150+(s.shippingCharge?25:0)+(s.discountAmount?25:0);if(y+totalHeight>740){doc.addPage();y=50;}else y+=24;
    const line=(label:string,value:number,bold=false)=>{text(label,305,y,115,bold?13:10,bold);text(money(value),420,y,123,bold?13:10,bold,"right");y+=bold?36:25;};
    line("Subtotal",s.subtotal);if(s.shippingCharge)line("Delivery charge",s.shippingCharge);if(s.discountAmount)line("Order discount",-s.discountAmount);doc.moveTo(305,y-5).lineTo(right,y-5).strokeColor("#dddddd").stroke();line("Total",s.totalAmount);y+=10;line("Amount due",amountDue(s),true);
    text("Thank you for choosing HIMATU.",44,Math.min(765,y+35),400,10);
    const pages=doc.bufferedPageRange();for(let i=0;i<pages.count;i++){doc.switchToPage(i);text(`${i+1} / ${pages.count}`,480,785,63,8,false,"right");}doc.end();
  });
}
