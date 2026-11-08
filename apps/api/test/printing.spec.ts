import { Test, TestingModule } from "@nestjs/testing";
import { PrintingService } from "../src/printing/printing.service";
import { ProductionService, PRODUCTION_STAGES } from "../src/printing/production.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { StorageService } from "../src/storage/storage.service";

describe("Custom 3D Printing Module", () => {
  let printingService: PrintingService;
  let productionService: ProductionService;

  const mockRequest = {
    id: "req-1",
    requestNumber: "PR-2026-1001",
    userId: "usr-456",
    customerName: "Gojō Satoru",
    customerEmail: "gojo@jujutsu.ac.jp",
    customerPhone: "01799887766",
    title: "Domain Expansion Hollow Purple Statue",
    animeName: "Jujutsu Kaisen",
    characterName: "Satoru Gojo",
    description: "Detailed 1/6 scale floating pose with translucent purple sphere effect.",
    posePreference: "Mid-air hollow purple activation",
    sizePreference: "1/6 Scale (~30cm)",
    materialPreference: "8K Resin",
    finishPreference: "Fully Hand-Painted (Master Level)",
    colorPreference: "Vibrant anime-accurate colors with pearlescent purple aura",
    budgetEstimate: 28000,
    deadlineDate: new Date(Date.now() + 30 * 86400000),
    status: "SUBMITTED",
    internalNotes: "Customer requested extra LED wire channel in the base",
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    quotations: [],
    production: null,
    user: {
      addresses: [
        {
          id: "addr-1",
          isDefault: true,
          recipientName: "Gojō Satoru",
          phone: "01799887766",
          district: "Dhaka",
          area: "Gulshan",
          fullAddress: "Road 10, House 5",
        },
      ],
    },
  };

  const mockQuotation = {
    id: "quo-1",
    requestId: "req-1",
    quotationNumber: "QUO-2026-1001",
    baseCost: 5000,
    materialCost: 4000,
    printingCost: 6000,
    finishingCost: 3000,
    paintingCost: 7000,
    customizationCost: 2000,
    shippingCost: 500,
    discountAmount: 1500,
    totalAmount: 26000,
    currency: "BDT",
    depositPercent: 50,
    depositAmount: 13000,
    productionDays: 21,
    termsAndNotes: "50% deposit required. Includes 3 revision previews during sculpting.",
    validUntil: new Date(Date.now() + 14 * 86400000),
    status: "PENDING",
    acceptedAt: null,
    rejectedAt: null,
    createdBy: "Master Artisan",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduction = {
    id: "prod-pipe-1",
    requestId: "req-1",
    orderId: "ord-3d-1",
    stage: "3D_MODELING",
    targetCompletionDate: new Date(Date.now() + 21 * 86400000),
    actualCompletionDate: null,
    assignedTechnician: "Zahir (Digital Sculptor)",
    notes: "High poly base mesh ready",
    createdAt: new Date(),
    updatedAt: new Date(),
    request: mockRequest,
    order: { orderNumber: "HMT-3D-202611-1001" },
    updates: [
      {
        id: "upd-1",
        productionId: "prod-pipe-1",
        stage: "3D_MODELING",
        customerMessage: "3D digital sculpt complete. Slicing next.",
        internalNote: "Customer approved head sculpt",
        progressImageUrl: "https://himatu.store/progress-1.webp",
        createdBy: "Zahir",
        createdAt: new Date(),
      },
    ],
  };

  const mockPrisma: any = {
    db: {
      printingRequest: {
        create: jest.fn().mockResolvedValue(mockRequest),
        findUnique: jest.fn().mockResolvedValue(mockRequest),
        findFirst: jest.fn().mockResolvedValue(mockRequest),
        findMany: jest.fn().mockResolvedValue([mockRequest]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(mockRequest),
      },
      printingQuotation: {
        create: jest.fn().mockResolvedValue(mockQuotation),
        update: jest.fn().mockResolvedValue({ ...mockQuotation, status: "ACCEPTED" }),
      },
      printingProduction: {
        create: jest.fn().mockResolvedValue(mockProduction),
        findUnique: jest.fn().mockResolvedValue(mockProduction),
        findMany: jest.fn().mockResolvedValue([mockProduction]),
        update: jest.fn().mockResolvedValue({ ...mockProduction, stage: "MODEL_SLICING" }),
      },
      productionUpdate: {
        create: jest.fn().mockResolvedValue({
          id: "upd-new",
          productionId: "prod-pipe-1",
          stage: "MODEL_SLICING",
          customerMessage: "Model slicing underway",
          createdAt: new Date(),
        }),
      },
      order: {
        create: jest.fn().mockResolvedValue({
          id: "ord-3d-1",
          orderNumber: "HMT-3D-202611-1001",
          totalAmount: 13000,
        }),
        update: jest.fn().mockResolvedValue({ id: "ord-3d-1" }),
      },
      $transaction: jest.fn((cbOrArray) => {
        if (typeof cbOrArray === "function") {
          return cbOrArray(mockPrisma.db);
        }
        return Promise.all(cbOrArray);
      }),
    },
  };

  const mockStorage = {
    uploadPrintingReference: jest.fn().mockResolvedValue({
      storagePath: "requests/req-1/sample.png",
      fileName: "sample.png",
      fileType: "image/png",
      fileSize: 1024,
      url: "https://signed.supabase.co/sample.png",
    }),
    getSignedPrintingUrl: jest.fn().mockResolvedValue("https://signed.supabase.co/sample.png"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrintingService,
        ProductionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    printingService = module.get<PrintingService>(PrintingService);
    productionService = module.get<ProductionService>(ProductionService);
  });

  describe("Request Submission", () => {
    it("creates custom printing request with specifications", async () => {
      const res = await printingService.createRequest("usr-456", {
        customerName: "Gojō Satoru",
        customerEmail: "gojo@jujutsu.ac.jp",
        customerPhone: "01799887766",
        title: "Domain Expansion Hollow Purple Statue",
        animeName: "Jujutsu Kaisen",
        characterName: "Satoru Gojo",
        description: "1/6 scale resin figure",
      });

      expect(res).toBeDefined();
      expect(res.customerName).toBe("Gojō Satoru");
      expect(res.status).toBe("SUBMITTED");
    });
  });

  describe("Quotation Engine", () => {
    it("calculates cost breakdown and 50% deposit correctly", async () => {
      const quote = await printingService.createQuotation("req-1", "Master Artisan", {
        baseCost: 5000,
        materialCost: 4000,
        printingCost: 6000,
        finishingCost: 3000,
        paintingCost: 7000,
        customizationCost: 2000,
        shippingCost: 500,
        discountAmount: 1500,
        depositPercent: 50,
        productionDays: 21,
      });

      expect(quote).toBeDefined();
      expect(quote.totalAmount).toBe(26000);
      expect(quote.depositAmount).toBe(13000);
      expect(quote.depositPercent).toBe(50);
      expect(quote.status).toBe("PENDING");
    });

    it("approves quotation and creates linked custom manufacturing order", async () => {
      mockPrisma.db.printingRequest.findFirst.mockResolvedValueOnce({
        ...mockRequest,
        quotations: [mockQuotation],
      });

      const approval = await printingService.approveQuotation("req-1", "usr-456");

      expect(approval).toBeDefined();
      expect(approval.orderNumber).toBeDefined();
      expect(approval.depositAmount).toBe(13000);
      expect(approval.quotationNumber).toBe("QUO-2026-1001");
    });
  });

  describe("Production Kanban Pipeline", () => {
    it("returns production board with all 10 stages", async () => {
      const board = await productionService.getProductionBoard();
      expect(board.stages.length).toBe(10);
      expect(board.stages).toEqual(PRODUCTION_STAGES);
      expect(board.columns["3D_MODELING"]).toBeDefined();
      expect(board.columns["PACKED_FOR_DELIVERY"]).toBeDefined();
    });

    it("transitions figure stage and records milestone log", async () => {
      const updated = await productionService.updateStage("prod-pipe-1", {
        stage: "MODEL_SLICING",
        notes: "Supports added successfully for delicate hair strands",
      });

      expect(updated).toBeDefined();
      expect(mockPrisma.db.productionUpdate.create).toHaveBeenCalled();
    });
  });
});
