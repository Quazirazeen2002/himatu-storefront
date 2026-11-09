import "reflect-metadata";
import { ConflictException } from "@nestjs/common";
import { CategoriesService } from "../src/categories/categories.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { CreateCategorySchema, storefrontTaxonomy } from "@himatu/shared";

const makeCategory = (overrides = {}) => ({ id:"11111111-1111-4111-8111-111111111111", name:"One Piece", slug:"one-piece", description:"Adventure", imageUrl:"/images/categories/demo.webp", imageIsDemo:true, kind:"FRANCHISE", family:"ANIME", isActive:true, displayOrder:0, createdAt:new Date(), updatedAt:new Date(), ...overrides });
describe("Independent product categories and franchises", () => {
  const db = { category:{ findMany:jest.fn(), findUnique:jest.fn(), create:jest.fn(), update:jest.fn() }, product:{count:jest.fn()} };
  const service = new CategoriesService({ db } as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());
  it("returns separate product-category counts without mixing franchise counts", async () => {
    db.category.findMany.mockResolvedValue([makeCategory({_count:{products:7,typedProducts:0}}),makeCategory({kind:"PRODUCT_TYPE",family:null,slug:"t-shirts",_count:{products:0,typedProducts:3}})]);
    const result=await service.listPublicCategories();
    expect(result.map(category=>category.productCount)).toEqual([7,3]);
    expect(db.category.findMany.mock.calls[0][0].where).toEqual({isActive:true});
  });
  it("includes hidden categories in admin results so they can be shown again",async()=>{
    db.category.findMany.mockResolvedValue([makeCategory({isActive:false})]);
    expect((await service.listAdminCategories())[0].isActive).toBe(false);
    expect(db.category.findMany.mock.calls[0][0].where).toBeUndefined();
  });
  it("creates a future product category with a safe demo cover and no franchise family",async()=>{
    db.category.findUnique.mockResolvedValue(null);
    db.category.create.mockImplementation(({data})=>Promise.resolve(makeCategory(data)));
    const result=await service.createCategory({name:"Hoodies",slug:"hoodies",kind:"PRODUCT_TYPE"});
    expect(result.family).toBeNull();expect(result.imageIsDemo).toBe(true);
    expect(result.imageUrl).toBe("/images/categories/category-default.svg");
  });
  it("prevents duplicate slugs, including a concurrent database conflict",async()=>{
    db.category.findUnique.mockResolvedValue(null);db.category.create.mockRejectedValue({code:"P2002"});
    await expect(service.createCategory({name:"One Piece",slug:"one-piece"})).rejects.toThrow(ConflictException);
  });
  it("does not let an assigned category switch between the two dimensions",async()=>{
    db.category.findUnique.mockResolvedValue(makeCategory());db.product.count.mockResolvedValue(1);
    await expect(service.updateCategory(makeCategory().id,{kind:"PRODUCT_TYPE"})).rejects.toThrow(ConflictException);
    expect(db.category.update).not.toHaveBeenCalled();
  });
  it("validates the supplied taxonomy, safe images and canonical URL slugs",()=>{
    expect(storefrontTaxonomy.filter(category=>category.kind==="PRODUCT_TYPE")).toHaveLength(5);
    expect(storefrontTaxonomy.filter(category=>category.family==="ANIME")).toHaveLength(11);
    for(const category of storefrontTaxonomy)expect(CreateCategorySchema.safeParse(category).success).toBe(true);
    for(const imageUrl of ["javascript:alert(1)","http://bad.test/img.png","//bad.test/img.png"])expect(CreateCategorySchema.safeParse({name:"Test",slug:"test",imageUrl}).success).toBe(false);
    expect(CreateCategorySchema.safeParse({name:"Bad",slug:"../bad"}).success).toBe(false);
  });
});
