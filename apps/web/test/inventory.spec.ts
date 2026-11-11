import type { ProductDto } from "@himatu/shared";
import { availableStock, inventoryGroups } from "../src/lib/inventory";
import { getAllAdminProducts } from "../src/lib/commerce-api";
const category = (id:string,name:string) => ({id,name,slug:id,description:null,imageUrl:null,isActive:true,displayOrder:0});
const figure = (id:string,type:string|undefined,franchise:string,total:number,reserved=0):ProductDto => ({id,name:id,slug:id,sku:`SKU-${id}`,shortDescription:null,description:"Test",price:1000,salePrice:null,currency:"BDT",categoryId:franchise,category:category(franchise,franchise),productType:type?category(type,type):undefined,isActive:true,isFeatured:false,images:[],createdAt:"2026-11-10",updatedAt:"2026-11-10",inventory:{quantity:total,reservedQuantity:reserved,availableQuantity:Math.max(0,total-reserved)}});
const products=[figure("Naruto figure","Action Figures","Naruto",10,2),figure("Luffy shirt","T-shirts","One Piece",5,5),figure("Zoro figure","Action Figures","One Piece",4),figure("Unknown",undefined,"Other",2)];
it("groups inventory independently by product category and franchise",()=>{
  expect(inventoryGroups(products,"product-type").map(g=>[g.name,g.products.length])).toEqual([["Action Figures",2],["T-shirts",1],["Unassigned",1]]);
  expect(inventoryGroups(products,"franchise").find(g=>g.name==="One Piece")?.products).toHaveLength(2);
});
it("uses available rather than reserved stock for filters and statuses",()=>{
  expect(availableStock(products[1])).toBe(0);
  expect(inventoryGroups(products,"product-type","","out").flatMap(g=>g.products).map(p=>p.name)).toEqual(["Luffy shirt"]);
  expect(inventoryGroups(products,"product-type","","low").flatMap(g=>g.products).map(p=>p.name)).toEqual(["Zoro figure","Unknown"]);
});
it("searches across names, SKU, category and franchise and handles no results",()=>{
  expect(inventoryGroups(products,"product-type","naruto").flatMap(g=>g.products)).toHaveLength(1);
  expect(inventoryGroups(products,"product-type","SKU-Zoro").flatMap(g=>g.products)).toHaveLength(1);
  expect(inventoryGroups(products,"product-type","missing")).toEqual([]);
});
it("loads every inventory page rather than silently dropping items after one hundred",async()=>{
  const original = global.fetch;
  global.fetch=jest.fn().mockResolvedValueOnce({ok:true,json:async()=>({items:[products[0]],totalPages:2})}).mockResolvedValueOnce({ok:true,json:async()=>({items:[products[1]],totalPages:2})});
  try {expect(await getAllAdminProducts("test-token")).toHaveLength(2);expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining("page=2"),expect.objectContaining({headers:expect.objectContaining({Authorization:"Bearer test-token"})}));} finally {global.fetch=original;}
});
