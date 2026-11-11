import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { ApiExceptionFilter } from "../src/common/exception.filter";
import { ProductsController } from "../src/products/products.controller";
import { ProductsService } from "../src/products/products.service";
import { CategoriesService } from "../src/categories/categories.service";
import { AuthGuard } from "../src/auth/auth.guard";
import { RolesGuard } from "../src/auth/roles";

describe("Admin photograph HTTP contracts", () => {
  let app: INestApplication;
  const products = { addProductImage: jest.fn().mockImplementation(async (_id, file, _alt, primary) => ({id:file.originalname,isPrimary:primary})), reorderProductImages:jest.fn().mockResolvedValue({success:true}), updateProductImage:jest.fn() };
  beforeAll(async () => {
    const module = await Test.createTestingModule({controllers:[ProductsController],providers:[{provide:ProductsService,useValue:products},{provide:CategoriesService,useValue:{}}]})
      .overrideGuard(AuthGuard).useValue({canActivate:()=>true}).overrideGuard(RolesGuard).useValue({canActivate:()=>true}).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it("accepts several files in one request and lets the service choose the first cover", async () => {
    const result = await request(app.getHttpServer()).post("/admin/products/product-1/images")
      .attach("files",Buffer.from("image-one"),{filename:"one.png",contentType:"image/png"})
      .attach("files",Buffer.from("image-two"),{filename:"two.png",contentType:"image/png"});
    expect(result.status).toBe(201);
    expect(result.body).toHaveLength(2);
    expect(products.addProductImage).toHaveBeenCalledWith("product-1",expect.anything(),undefined,undefined);
  });
  it("returns readable validation errors instead of a 500 when product fields are invalid", async () => {
    const result = await request(app.getHttpServer()).post("/admin/products").send({name:"Test", price:0});
    expect(result.status).toBe(400);
    expect(result.body.message).toContain("price:");
    expect(result.body.message).toContain("categoryId:");
  });
  it("routes reorder to the reorder handler rather than treating it as an image ID", async () => {
    const items=[{imageId:"two.png",sortOrder:0},{imageId:"one.png",sortOrder:1}];
    const result=await request(app.getHttpServer()).patch("/admin/products/product-1/images/reorder").send({items});
    expect(result.status).toBe(200);
    expect(products.reorderProductImages).toHaveBeenCalledWith("product-1",items);
    expect(products.updateProductImage).not.toHaveBeenCalled();
  });
});
