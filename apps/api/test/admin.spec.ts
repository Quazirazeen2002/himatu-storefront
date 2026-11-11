import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { AdminService } from "../src/admin/admin.service";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Stage 3 Step 2D: Admin Service & Control Center Analytics", () => {
  let service: AdminService;

  const mockOrders = [
    {
      id: "ord-1",
      orderNumber: "HMT-20261108-10001",
      userId: "user-1",
      addressSnapshot: { recipientName: "Razeen", district: "Dhaka" },
      subtotal: 6500,
      shippingCharge: 80,
      discountAmount: 0,
      totalAmount: 6580,
      currency: "BDT",
      orderStatus: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "COD",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: "item-1",
          orderId: "ord-1",
          productId: "prod-1",
          productName: "Luffy · Gear Five",
          sku: "HMT-OP-001",
          unitPrice: 6500,
          quantity: 1,
          lineTotal: 6500,
        },
      ],
    },
    {
      id: "ord-2",
      orderNumber: "HMT-20261108-10002",
      userId: "user-2",
      addressSnapshot: { recipientName: "Jubair", district: "Chittagong" },
      subtotal: 5000,
      shippingCharge: 150,
      discountAmount: 0,
      totalAmount: 5150,
      currency: "BDT",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "COD",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: "item-2",
          orderId: "ord-2",
          productId: "prod-2",
          productName: "Zoro · Three-Sword Style",
          sku: "HMT-OP-002",
          unitPrice: 5000,
          quantity: 1,
          lineTotal: 5000,
        },
      ],
    },
    {
      id: "ord-3",
      orderNumber: "HMT-20261108-10003",
      userId: "user-3",
      addressSnapshot: { recipientName: "Customer", district: "Sylhet" },
      subtotal: 7000,
      shippingCharge: 150,
      discountAmount: 0,
      totalAmount: 7150,
      currency: "BDT",
      orderStatus: "CANCELLED",
      paymentStatus: "PENDING",
      paymentMethod: "COD",
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    },
  ];

  const mockPrisma = {
    db: {
      order: {
        findMany: jest.fn().mockResolvedValue(mockOrders),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return mockOrders.find((o) => o.id === where.id || o.orderNumber === where.orderNumber) || null;
        }),
        count: jest.fn().mockResolvedValue(mockOrders.length),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const ord = mockOrders.find((o) => o.id === where.id);
          return { ...ord, ...data };
        }),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "item-1",
            productId: "prod-1",
            productName: "Luffy · Gear Five",
            sku: "HMT-OP-001",
            productImage: null,
            quantity: 2,
            lineTotal: 13000,
            product: { inventory: { quantity: 8 }, category: { name: "One Piece" } },
          },
        ]),
      },
      product: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where?.inventory) return Promise.resolve(1); // 1 low stock
          return Promise.resolve(7); // 7 active
        }),
      },
      userProfile: {
        count: jest.fn().mockResolvedValue(12),
        findMany: jest.fn().mockResolvedValue([
          {
            id: "user-1",
            fullName: "Razeen Jubair",
            email: "razeen@example.com",
            phone: "01711111111",
            role: "ADMIN",
            createdAt: new Date(),
            orders: [{ totalAmount: 6580 }],
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: "user-1",
          fullName: "Razeen Jubair",
          email: "razeen@example.com",
          addresses: [],
          orders: [],
        }),
      },
      inventory: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma.db)),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it("calculates dashboard KPIs accurately, distinguishing collected vs pending COD", async () => {
    const summary = await service.getDashboardSummary("all");

    expect(summary.totalOrders).toBe(3);
    // ord-1 is DELIVERED and PAID -> 6580
    expect(summary.totalSales).toBe(6580);
    // ord-2 is PENDING and COD -> 5150
    expect(summary.pendingSales).toBe(5150);
    // ord-3 is CANCELLED -> not counted in sales
    expect(summary.cancelledOrders).toBe(1);
    expect(summary.pendingOrders).toBe(1);
    expect(summary.deliveredOrders).toBe(1);
    expect(summary.activeProducts).toBe(7);
    expect(summary.lowStockProducts).toBe(1);
    expect(summary.totalCustomers).toBe(12);
  });

  it("aggregates top selling figures from actual OrderItems", async () => {
    const top = await service.getTopProducts(5);
    expect(top).toHaveLength(1);
    expect(top[0].productName).toBe("Luffy · Gear Five");
    expect(top[0].unitsSold).toBe(2);
    expect(top[0].revenue).toBe(13000);
  });

  it("updates order status and marks COD paid on delivery", async () => {
    const updated = await service.updateOrderStatus("ord-2", "DELIVERED");
    expect(mockPrisma.db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ord-2" },
        data: expect.objectContaining({
          orderStatus: "DELIVERED",
          paymentStatus: "PAID",
        }),
      }),
    );
  });

  it("restores inventory stock on order cancellation", async () => {
    await service.updateOrderStatus("ord-1", "CANCELLED", "Damaged figure");
    expect(mockPrisma.db.inventory.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "prod-1" },
        data: { quantity: { increment: 1 } },
      }),
    );
  });

  it("reads and updates store configuration settings", () => {
    const initial = service.getStoreSettings();
    expect(initial.currency).toBe("BDT");

    const newRate = initial.insideDhakaShipping === 80 ? 95 : 80;
    try {
      const updated = service.updateStoreSettings({ insideDhakaShipping: newRate });
      expect(updated.insideDhakaShipping).toBe(newRate);
    } finally {
      service.updateStoreSettings({ insideDhakaShipping: initial.insideDhakaShipping });
    }
  });
});
