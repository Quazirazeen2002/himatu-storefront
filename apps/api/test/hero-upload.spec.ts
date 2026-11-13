import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { HeroUploadController } from "../src/social-orders/hero-upload.controller";
import { StorageService } from "../src/storage/storage.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuthGuard } from "../src/auth/auth.guard";
import { RolesGuard } from "../src/auth/roles";

describe("hero media upload", () => {
  let app: INestApplication;
  const media = { type: "video", src: "https://example.test/hero/video.mp4", alt: "new hero" };
  const storage = {
    createHeroUpload: jest.fn().mockResolvedValue({path:"hero/12345678-1234-1234-1234-123456789abc.mp4",signedUrl:"https://example.test/signed-upload",contentType:"video/mp4"}),
    completeHeroUpload: jest.fn().mockResolvedValue(media),
  };
  const upsert = jest.fn().mockResolvedValue({});
  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [HeroUploadController],
      providers: [
        { provide: StorageService, useValue: storage },
        { provide: PrismaService, useValue: { db: { siteContent: { upsert } } } },
        RolesGuard,
      ],
    }).overrideGuard(AuthGuard).useValue({
      canActivate: (ctx: {switchToHttp: () => {getRequest: () => {headers: Record<string,string>; customer?: {role:string}}}}) => {
        const req = ctx.switchToHttp().getRequest();
        req.customer = {role:req.headers["x-test-role"] || "CUSTOMER"};
        return true;
      },
    }).compile();
    app = testingModule.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  beforeEach(() => { jest.clearAllMocks(); });

  it("rejects non-admin upload initiation", async () => {
    const response = await request(app.getHttpServer()).post("/admin/content/hero/upload").send({fileName:"hero.mp4",contentType:"video/mp4",size:100});
    expect(response.status).toBe(403);
    expect(storage.createHeroUpload).not.toHaveBeenCalled();
  });

  it("issues a signed upload and publishes only after completion", async () => {
    const start = await request(app.getHttpServer()).post("/admin/content/hero/upload").set("x-test-role","ADMIN").send({fileName:"hero.mp4",contentType:"video/mp4",size:100});
    expect(start.status).toBe(201);
    expect(start.body.signedUrl).toBe("https://example.test/signed-upload");
    expect(upsert).not.toHaveBeenCalled();
    const finish = await request(app.getHttpServer()).post("/admin/content/hero/upload/complete").set("x-test-role","ADMIN").send({path:start.body.path,contentType:"video/mp4",alt:"new hero"});
    expect(finish.status).toBe(201);
    expect(finish.body.media).toEqual(media);
    expect(storage.completeHeroUpload).toHaveBeenCalledWith(start.body.path,"video/mp4","new hero");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({where:{key:"hero-media"},create:{key:"hero-media",value:{media}}}));
  });
});
