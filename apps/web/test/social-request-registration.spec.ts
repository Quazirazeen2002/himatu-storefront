import { registerSocialOrder } from "../src/lib/social-orders";
const input = {channel:"tiktok" as const,customer:{fullName:"Private Customer",email:"private@example.com",phone:"01700000000",address:"House 123",area:"Area",district:"Dhaka",postalCode:"",orderNotes:""},items:[{name:"Figure",slug:"figure",quantity:1,unitPrice:1000,productId:null}]};
let stored:string|null;
beforeEach(()=>{stored=null;Object.defineProperty(globalThis,"sessionStorage",{configurable:true,value:{getItem:()=>stored,setItem:(_key:string,value:string)=>{stored=value;}}});});
afterEach(()=>{jest.restoreAllMocks();Reflect.deleteProperty(globalThis,"sessionStorage");});
it("reuses the request reference for repeated pending submissions without storing contact data",async()=>{
 const fetcher=jest.spyOn(global,"fetch").mockImplementation(async()=>new Response(JSON.stringify({id:"request",status:"PENDING"}),{status:201}));
 await registerSocialOrder("token",input);await registerSocialOrder("token",input);
 const bodies=fetcher.mock.calls.map(([,options])=>JSON.parse(String(options?.body)));
 expect(bodies[0].clientReference).toBe(bodies[1].clientReference);expect(stored).not.toContain("Private Customer");expect(stored).not.toContain("private@example.com");
});
it("starts a fresh request for another purchase after staff close the previous request",async()=>{
 const fetcher=jest.spyOn(global,"fetch").mockResolvedValueOnce(new Response(JSON.stringify({id:"old",status:"CONFIRMED"}),{status:201})).mockResolvedValueOnce(new Response(JSON.stringify({id:"new",status:"PENDING"}),{status:201}));
 expect((await registerSocialOrder("token",input)).id).toBe("new");
 const bodies=fetcher.mock.calls.map(([,options])=>JSON.parse(String(options?.body)));expect(bodies[0].clientReference).not.toBe(bodies[1].clientReference);
});
it("fails when dashboard registration fails instead of reporting a prepared order",async()=>{jest.spyOn(global,"fetch").mockResolvedValue(new Response(JSON.stringify({message:"API unavailable"}),{status:503}));await expect(registerSocialOrder("token",input)).rejects.toThrow("API unavailable");});

it("registers a direct website order without dropping original and sale prices",async()=>{
 const fetcher=jest.spyOn(global,"fetch").mockResolvedValue(new Response(JSON.stringify({id:"website-request",status:"PENDING"}),{status:201}));
 await registerSocialOrder("token",{...input,channel:"website",items:[{...input.items[0],originalUnitPrice:1200}]});
 expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toMatchObject({channel:"website",items:[{unitPrice:1000,originalUnitPrice:1200}]});
});
