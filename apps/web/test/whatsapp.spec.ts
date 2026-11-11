import { formatWhatsAppOrder, whatsappLink, OWNER_WHATSAPP } from "../src/lib/whatsapp";
import { referenceProducts } from "../src/lib/reference-products";
import { storefrontTaxonomy } from "@himatu/shared";
import { sanitizeState } from "../src/lib/demo-store";
import { discover, emptyFilters } from "../src/lib/discovery";
import { products } from "../src/lib/config";
import { pricedTotal } from "../src/lib/pricing";

describe("WhatsApp order handoff", () => {
  it("uses the owner's international number and preserves the complete encoded draft", () => {
    const message = formatWhatsAppOrder({
      customer: { fullName: "QA Collector", email: "qa@example.com", phone: "01700000000", address: "House 2, Road 5", area: "Dhanmondi", district: "Dhaka", postalCode: "1205", orderNotes: "Call first & handle carefully" },
      items: [{ name: "Luffy · Gear Five", character: "Monkey D. Luffy", quantity: 2, unitPrice: 5525, slug: "straw-hat-captain" }],
      subtotal: 11050, discount: 0, shipping: 80, total: 11130, shippingMethod: "Inside Dhaka", paymentMethod: "COD", origin: "https://himatu.example",
    });
    const link = new URL(whatsappLink(message));
    expect(OWNER_WHATSAPP).toBe("8801714546809");
    expect(link.pathname).toBe("/8801714546809");
    expect(link.searchParams.get("text")).toBe(message);
    for (const value of ["Qty: 2", "11,050", "11,130", "QA Collector", "qa@example.com", "01700000000", "House 2, Road 5", "Dhanmondi, Dhaka", "1205", "Call first & handle carefully", "https://himatu.example/products/straw-hat-captain"]) expect(message).toContain(value);
    expect(message).not.toContain("Extra discount");
    expect(message).not.toContain("Please confirm availability, final pricing");
    expect(message).not.toContain("no payment has been made");
  });
  it("includes an applied discount and omits blank optional details", () => {
    const message = formatWhatsAppOrder({ customer: { fullName:"A", email:"a@example.com", phone:"01700000000", address:"B", area:"C", district:"Dhaka", postalCode:"", orderNotes:"" }, items:[],subtotal:1000,discount:100,shipping:80,total:980,shippingMethod:"Courier",paymentMethod:"bKash",origin:"https://himatu.example" });
    expect(message).toContain("Extra discount: −BDT 100");
    expect(message).not.toContain("Postal code:");
    expect(message).not.toContain("SPECIAL INSTRUCTIONS");
  });
});
it("uses owner-approved prices in mixed WhatsApp totals without preview wording", () => {
  const message = formatWhatsAppOrder({customer:{fullName:"QA",email:"qa@example.com",phone:"01700000000",address:"A",area:"B",district:"Dhaka",postalCode:"",orderNotes:""},items:[{name:"Naruto",character:"Naruto Uzumaki",quantity:2,unitPrice:3290,slug:"naruto-uzumaki"},{name:"Luffy",character:"Monkey D. Luffy",quantity:1,unitPrice:5525,slug:"straw-hat-captain"}],subtotal:12105,discount:0,shipping:80,total:12185,shippingMethod:"Courier",paymentMethod:"COD",origin:"https://himatu.example"});
  expect(message).toContain("Qty: 2 × BDT 3,290 = BDT 6,580");
  expect(message).toContain("Subtotal: BDT 12,105");
  expect(message).toContain("Estimated total: BDT 12,185");
  expect(message).not.toContain("Awaiting quote");
  expect(message).not.toMatch(/\bdemo\b/i);
});

describe("Real-photo reference catalogue", () => {
  it("covers every requested category and uses owner-approved selling prices without inventing stock", () => {
    for (const category of storefrontTaxonomy.filter(c => c.slug !== "other-collections")) {
      const matches=[...products,...referenceProducts].filter(p => category.kind === "PRODUCT_TYPE" ? p.productCategory === category.slug : p.collection === category.slug);
      expect(matches.length).toBeGreaterThan(0);
    }
    expect(referenceProducts).toHaveLength(17);
    expect(referenceProducts.every(p=>p.images.length > 0 && Number.isSafeInteger(p.price) && p.price > 0 && p.priceIsDemo === false && p.availability === undefined && p.source.page.startsWith("https://"))).toBe(true);
  });
  it("persists approved-price references and includes them in price filtering and cart totals", () => {
    const p=referenceProducts[0];
    expect(sanitizeState({bag:{[p.id]:1},wishlist:[p.id]})).toMatchObject({bag:{[p.id]:1},wishlist:[p.id]});
    expect(discover(referenceProducts,{...emptyFilters,minimum:"1"},"low")).toHaveLength(referenceProducts.length);
    expect(discover([p],{...emptyFilters,maximum:String(p.price - 1)},"low")).toEqual([]);
    expect(pricedTotal([p,products[0]],{[p.id]:2,[products[0].id]:1})).toEqual({subtotal:12105,count:3});
  });
});
