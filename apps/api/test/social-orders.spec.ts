import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { SocialOrdersController } from "../src/social-orders/social-orders.controller";
import { SocialOrdersService } from "../src/social-orders/social-orders.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { AuthGuard } from "../src/auth/auth.guard";
import { RolesGuard } from "../src/auth/roles";
import { ApiExceptionFilter } from "../src/common/exception.filter";
import { ConfigService } from "@nestjs/config";
import { invoiceHtml } from "../src/social-orders/invoice";
const customer = {
  fullName: "Customer",
  email: "c@example.com",
  phone: "01700000000",
  address: "House 123",
  district: "Dhaka",
  area: "Gulshan",
  postalCode: "",
  orderNotes: "",
};
const input = {
  clientReference: "11111111-1111-4111-8111-111111111111",
  channel: "whatsapp",
  customer,
  items: [
    {
      name: "Figure",
      slug: "figure",
      quantity: 2,
      unitPrice: 1000,
      productId: null,
    },
  ],
};
describe("Social order boundary", () => {
  let app: INestApplication;
  const service = {
    submit: jest.fn().mockResolvedValue({ id: "request" }),
    list: jest.fn().mockResolvedValue({ items: [] }),
    reviewInvoice: jest.fn(),
    sendInvoice: jest.fn(),
    confirm: jest.fn(),
  };
  beforeAll(async () => {
    const m = await Test.createTestingModule({
      controllers: [SocialOrdersController],
      providers: [
        RolesGuard,
        { provide: SocialOrdersService, useValue: service },
        {
          provide: PrismaService,
          useValue: {
            db: {
              siteContent: { findUnique: jest.fn().mockResolvedValue(null) },
            },
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          req.customer = {
            id: "customer",
            role: req.headers["x-test-role"] || "CUSTOMER",
          };
          return true;
        },
      })
      .compile();
    app = m.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });
  afterAll(() => app.close());
  it("registers authenticated checkout requests", async () => {
    const res = await request(app.getHttpServer())
      .post("/social-orders")
      .send(input);
    expect(res.status).toBe(201);
    expect(service.submit).toHaveBeenCalledWith("customer", input);
  });
  it("accepts direct website requests with original and sale price snapshots", async () => {
    const payload={...input,channel:"website",items:input.items.map(item=>({...item,originalUnitPrice:1200}))};
    expect((await request(app.getHttpServer()).post("/social-orders").send(payload)).status).toBe(201);
    expect(service.submit).toHaveBeenLastCalledWith("customer",payload);
  });
  it("does not allow customers into the inbox", async () => {
    expect(
      (await request(app.getHttpServer()).get("/admin/social-orders")).status,
    ).toBe(403);
  });
  it("lets moderators view requests, but blocks invoice sending and staff settings", async () => {
    expect(
      (
        await request(app.getHttpServer())
          .get("/admin/social-orders")
          .set("x-test-role", "MODERATOR")
      ).status,
    ).toBe(200);
    for (const path of [
      "/admin/invoices/order/send",
      "/admin/invoices/order/review",
    ])
      expect(
        (
          await request(app.getHttpServer())
            .post(path)
            .set("x-test-role", "MODERATOR")
        ).status,
      ).toBe(403);
    expect(service.sendInvoice).not.toHaveBeenCalled();
  });
  it("validates request details and refuses manual channels from customers", async () => {
    expect(
      (
        await request(app.getHttpServer())
          .post("/social-orders")
          .send({ ...input, items: [] })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app.getHttpServer())
          .post("/social-orders")
          .send({ ...input, channel: "manual" })
      ).status,
    ).toBe(400);
  });
});
describe("Social request enrollment", () => {
  const tx: any = {
    socialOrderRequest: {
      findUnique: jest
        .fn()
        .mockResolvedValue({
          id: "request",
          userId: "customer",
          channel: "whatsapp",
        }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn(),
    },
    order: { create: jest.fn().mockResolvedValue({ id: "order" }) },
    product: { findUnique: jest.fn() },
    inventory: { updateMany: jest.fn() },
  };
  const db: any = {
    socialOrderRequest: { findUnique:jest.fn().mockResolvedValue(null),count:jest.fn().mockResolvedValue(0),upsert: jest.fn().mockResolvedValue({ id: "same" }) },
    $transaction: (fn: any) => fn(tx),
  };
  const service = new SocialOrdersService(
    { db } as PrismaService,
    new ConfigService(),
  );
  beforeEach(() => {
    jest.clearAllMocks();
    tx.socialOrderRequest.updateMany.mockResolvedValue({ count: 1 });
  });
  it("uses a per-customer idempotent request key", async () => {
    await service.submit("customer", input as any);
    expect(db.socialOrderRequest.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_clientReference: {
            userId: "customer",
            clientReference: input.clientReference,
          },
        },
        update: {},
      }),
    );
  });
  it("creates final totals from reviewed line prices and keeps unpaid orders pending", async () => {
    await service.confirm(
      "request",
      {
        items: input.items,
        customer,
        shippingCharge: 80,
        discountAmount: 100,
        paid: false,
      },
      "ADMIN",
    );
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 2000,
          totalAmount: 1980,
          orderStatus: "CONFIRMED",
          paymentStatus: "PENDING",
        }),
      }),
    );
  });
  it("does not enroll the same request twice", async () => {
    tx.socialOrderRequest.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.confirm(
        "request",
        {
          items: input.items,
          customer,
          shippingCharge: 0,
          discountAmount: 0,
          paid: false,
        },
        "ADMIN",
      ),
    ).rejects.toThrow("already enrolled");
    expect(tx.order.create).not.toHaveBeenCalled();
  });
  it("rejects negative final totals and moderator payment flags", async () => {
    await expect(
      service.confirm(
        "request",
        {
          items: input.items,
          customer,
          shippingCharge: 0,
          discountAmount: 9999,
          paid: false,
        },
        "ADMIN",
      ),
    ).rejects.toThrow("Invalid order total");
    await expect(
      service.confirm(
        "request",
        {
          items: input.items,
          customer,
          shippingCharge: 0,
          discountAmount: 0,
          paid: true,
        },
        "MODERATOR",
      ),
    ).rejects.toThrow("Only administrators");
  });
  it("fails explicitly without SMTP and escapes invoice customer content", async () => {
    await expect(service.sendInvoice("order")).rejects.toThrow("SMTP");
    const html = invoiceHtml({
      number: "HMT",
      date: "2026-11-11",
      customer: { ...customer, fullName: "<script>alert(1)</script>" },
      items: [],
      subtotal: 0,
      totalAmount: 0,
      shippingCharge: 0,
      discountAmount: 0,
      paymentStatus: "PENDING",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
