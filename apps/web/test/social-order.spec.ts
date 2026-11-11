import { formatWhatsAppOrder, instagramOrderLink, whatsappLink } from "../src/lib/whatsapp";
import { CreateOrderSchema } from "@himatu/shared";
it("opens the owner's Instagram conversation without putting personal details in its URL",()=>{
 expect(instagramOrderLink()).toBe("https://ig.me/m/himatuofficial");
 expect(new URL(instagramOrderLink()).search).toBe("");
 const message=formatWhatsAppOrder({customer:{fullName:"Customer",email:"customer@example.com",phone:"01700000000",address:"House 5",area:"Area",district:"Dhaka",postalCode:"",orderNotes:""},items:[{name:"Figure",character:"Character",quantity:2,unitPrice:1000,slug:"figure"}],subtotal:2000,discount:0,shipping:80,total:2080,shippingMethod:"Courier",paymentMethod:"bKash",origin:"https://himatu.com"});
 expect(message).toContain("Payment preference: bKash");
 expect(message).toContain("House 5");
 expect(new URL(whatsappLink(message)).searchParams.get("text")).toBe(message);
});
it("accepts only bKash for new orders while defaulting omitted payment methods to bKash",()=>{
 const addressId="11111111-1111-4111-8111-111111111111";
 expect(CreateOrderSchema.parse({addressId}).paymentMethod).toBe("BKASH");
 for(const paymentMethod of ["COD","CARD","NAGAD","SSLCOMMERZ"])expect(CreateOrderSchema.safeParse({addressId,paymentMethod}).success).toBe(false);
});
