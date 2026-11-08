import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "../src/analytics/analytics.service";
import { AiInsightsService } from "../src/analytics/ai-insights.service";
import { PrismaService } from "../src/prisma/prisma.service";

describe("AnalyticsService and AiInsightsService", () => {
  let analyticsService: AnalyticsService;
  let aiInsightsService: AiInsightsService;

  const mockOrders = [
    {
      id: "ord-1",
      orderNumber: "HMT-1001",
      userId: "usr-1",
      totalAmount: 14500,
      orderStatus: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "COD",
      createdAt: new Date("2026-11-05T10:00:00.000Z"),
      addressSnapshot: { district: "Dhaka" },
      items: [
        {
          id: "item-1",
          productId: "prod-1",
          productName: "Luffy Gear 5",
          sku: "OP-LUFFY-01",
          quantity: 1,
          lineTotal: 14500,
          product: { categoryId: "cat-1" },
        },
      ],
    },
    {
      id: "ord-2",
      orderNumber: "HMT-1002",
      userId: "usr-2",
      totalAmount: 9200,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "COD",
      createdAt: new Date("2026-11-06T12:00:00.000Z"),
      addressSnapshot: { district: "Chittagong" },
      items: [
        {
          id: "item-2",
          productId: "prod-2",
          productName: "Zoro Wano Arc",
          sku: "OP-ZORO-01",
          quantity: 1,
          lineTotal: 9200,
          product: { categoryId: "cat-1" },
        },
      ],
    },
    {
      id: "ord-3",
      orderNumber: "HMT-1003",
      userId: "usr-1",
      totalAmount: 7500,
      orderStatus: "CANCELLED",
      paymentStatus: "PENDING",
      paymentMethod: "COD",
      createdAt: new Date("2026-11-07T14:00:00.000Z"),
      addressSnapshot: { district: "Dhaka" },
      items: [
        {
          id: "item-3",
          productId: "prod-3",
          productName: "Naruto Sage Mode",
          sku: "NAR-01",
          quantity: 1,
          lineTotal: 7500,
          product: { categoryId: "cat-2" },
        },
      ],
    },
  ];

  const mockCategories = [
    {
      id: "cat-1",
      name: "One Piece",
      slug: "one-piece",
      imageUrl: null,
      isActive: true,
      displayOrder: 1,
      products: [{ id: "prod-1" }, { id: "prod-2" }],
    },
    {
      id: "cat-2",
      name: "Naruto",
      slug: "naruto",
      imageUrl: null,
      isActive: true,
      displayOrder: 2,
      products: [{ id: "prod-3" }],
    },
  ];

  const mockProducts = [
    {
      id: "prod-1",
      name: "Luffy Gear 5 Sun God Nika",
      slug: "luffy-gear-5",
      sku: "OP-LUFFY-01",
      price: 14500,
      isActive: true,
      inventory: { quantity: 4, reservedQuantity: 1 },
      category: { id: "cat-1", name: "One Piece" },
      images: [{ imageUrl: "/img1.jpg" }],
    },
    {
      id: "prod-2",
      name: "Roronoa Zoro King of Hell",
      slug: "zoro-king-of-hell",
      sku: "OP-ZORO-01",
      price: 9200,
      isActive: true,
      inventory: { quantity: 0, reservedQuantity: 0 },
      category: { id: "cat-1", name: "One Piece" },
      images: [{ imageUrl: "/img2.jpg" }],
    },
    {
      id: "prod-3",
      name: "Naruto Uzumaki Sage Mode",
      slug: "naruto-sage-mode",
      sku: "NAR-01",
      price: 7500,
      isActive: true,
      inventory: { quantity: 15, reservedQuantity: 0 },
      category: { id: "cat-2", name: "Naruto" },
      images: [{ imageUrl: "/img3.jpg" }],
    },
  ];

  const mockPrisma = {
    db: {
      order: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          // If filtering by status CANCELLED exclusion
          if (where?.orderStatus?.not === "CANCELLED") {
            return mockOrders.filter((o) => o.orderStatus !== "CANCELLED");
          }
          return mockOrders;
        }),
        count: jest.fn().mockResolvedValue(2),
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "item-1",
            productId: "prod-1",
            productName: "Luffy Gear 5",
            sku: "OP-LUFFY-01",
            quantity: 1,
            lineTotal: 14500,
            product: mockProducts[0],
          },
          {
            id: "item-2",
            productId: "prod-2",
            productName: "Zoro Wano Arc",
            sku: "OP-ZORO-01",
            quantity: 1,
            lineTotal: 9200,
            product: mockProducts[1],
          },
        ]),
      },
      category: {
        findMany: jest.fn().mockResolvedValue(mockCategories),
      },
      product: {
        findMany: jest.fn().mockResolvedValue(mockProducts),
        count: jest.fn().mockResolvedValue(3),
      },
      userProfile: {
        count: jest.fn().mockResolvedValue(5),
      },
      wishlistItem: {
        groupBy: jest.fn().mockResolvedValue([
          { productId: "prod-1", _count: { productId: 8 } },
          { productId: "prod-2", _count: { productId: 5 } },
        ]),
      },
      analyticsEvent: {
        groupBy: jest.fn().mockResolvedValue([{ sessionId: "s-1" }, { sessionId: "s-2" }]),
        count: jest.fn().mockResolvedValue(4),
        create: jest.fn().mockResolvedValue({ id: "event-1" }),
      },
      analyticsInsight: {
        create: jest.fn().mockResolvedValue({ id: "insight-1" }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        AiInsightsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    aiInsightsService = module.get<AiInsightsService>(AiInsightsService);
  });

  describe("Revenue Intelligence", () => {
    it("distinguishes collected revenue from pending COD and excludes cancelled orders", async () => {
      const result = await analyticsService.getRevenueIntelligence({
        period: "last_30_days",
      });

      expect(result.grossOrderValue).toBe(14500 + 9200); // 23700 (excludes cancelled 7500)
      expect(result.collectedRevenue).toBe(14500); // Delivered & Paid
      expect(result.pendingCodRevenue).toBe(9200); // Open COD order
      expect(result.totalOrders).toBe(2);
      expect(result.cancelledOrders).toBe(1);
      expect(result.averageOrderValue).toBe(11850);
    });

    it("handles zero baseline safely without returning misleading infinite growth", async () => {
      // Mock previous orders as empty
      mockPrisma.db.order.findMany.mockImplementationOnce(() => mockOrders); // current
      mockPrisma.db.order.findMany.mockImplementationOnce(() => []); // previous

      const result = await analyticsService.getRevenueIntelligence({
        period: "last_7_days",
      });

      expect(result.comparison.collectedChangePercent).toBeNull();
      expect(result.comparison.govChangePercent).toBeNull();
    });
  });

  describe("Collection Performance", () => {
    it("aggregates units and revenue by authentic anime categories", async () => {
      const result = await analyticsService.getCollectionPerformance({
        period: "last_30_days",
      });

      expect(result.collections.length).toBe(2);
      const onePiece = result.collections.find((c) => c.name === "One Piece");
      expect(onePiece).toBeDefined();
      expect(onePiece?.unitsSold).toBe(2);
      expect(onePiece?.revenue).toBe(23700);
      expect(result.leaderboard[0].name).toBe("One Piece");
    });
  });

  describe("Inventory Health", () => {
    it("correctly flags in-stock, low-stock (<=5), and out-of-stock figures", async () => {
      const result = await analyticsService.getInventoryHealth(5);

      expect(result.totalActiveProducts).toBe(3);
      expect(result.inStockCount).toBe(1); // Naruto (15)
      expect(result.lowStockCount).toBe(1); // Luffy (4)
      expect(result.outOfStockCount).toBe(1); // Zoro (0)
      expect(result.totalAvailableUnits).toBe(19);

      expect(result.lowStockAlerts.length).toBe(2);
      expect(result.lowStockAlerts[0].name).toBe("Roronoa Zoro King of Hell");
      expect(result.lowStockAlerts[0].status).toBe("OUT_OF_STOCK");
    });
  });

  describe("AI Business Insights Engine", () => {
    it("generates structured, grounded business insights adhering to schema", async () => {
      const insights = await aiInsightsService.generateInsights({
        period: "last_30_days",
      });

      expect(insights.length).toBeGreaterThan(0);
      for (const ins of insights) {
        expect(ins).toHaveProperty("id");
        expect(ins).toHaveProperty("title");
        expect(ins).toHaveProperty("category");
        expect(["opportunity", "warning", "performance", "recommendation"]).toContain(ins.category);
        expect(ins).toHaveProperty("summary");
        expect(ins).toHaveProperty("evidence");
        expect(ins).toHaveProperty("recommendedAction");
        expect(ins).toHaveProperty("destination");
        expect(ins.destination.startsWith("/admin")).toBe(true);
        expect(ins.source).toBe("rule-based"); // deterministic fallback when no LLM key
      }
    });
  });

  describe("First-Party Event Ingestion", () => {
    it("sanitizes metadata and records storefront analytics events", async () => {
      await analyticsService.trackEvent({
        eventName: "product_viewed",
        sessionId: "sess-abc-123",
        productId: "prod-1",
        metadata: {
          scale: "1/6",
          password: "should_be_stripped",
          token: "secret_token",
        },
      });

      expect(mockPrisma.db.analyticsEvent.create).toHaveBeenCalledWith({
        data: {
          eventName: "product_viewed",
          sessionId: "sess-abc-123",
          productId: "prod-1",
          userId: null,
          categoryId: null,
          metadata: { scale: "1/6" }, // sensitive fields stripped
        },
      });
    });
  });
});

