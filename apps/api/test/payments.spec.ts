import { Test, TestingModule } from "@nestjs/testing";
import { PaymentsService } from "../src/payments/payments.service";
import { ReconciliationService } from "../src/payments/reconciliation.service";
import { RefundsService } from "../src/payments/refunds.service";
import { BkashProvider } from "../src/payments/providers/bkash.provider";
import { SslcommerzProvider } from "../src/payments/providers/sslcommerz.provider";
import { CodProvider } from "../src/payments/providers/cod.provider";
import { PrismaService } from "../src/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

describe("Payments Module", () => {
  let paymentsService: PaymentsService;
  let reconciliationService: ReconciliationService;
  let refundsService: RefundsService;

  const mockOrder = {
    id: "ord-123",
    orderNumber: "HMT-20261108-9999",
    userId: "usr-456",
    totalAmount: 18500,
    currency: "BDT",
    orderStatus: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    addressSnapshot: {
      recipientName: "Tanjiro Kamado",
      phone: "01711223344",
      district: "Dhaka",
    },
    user: {
      fullName: "Tanjiro Kamado",
      email: "tanjiro@demon-slayer.jp",
      phone: "01711223344",
    },
  };

  const mockTransaction = {
    id: "txn-1",
    transactionRef: "TXN-20261108-100001",
    orderId: "ord-123",
    userId: "usr-456",
    provider: "BKASH",
    paymentMethod: "BKASH",
    providerTransactionId: "BK-TRX-9988",
    providerSessionId: "BK-SESSION-123",
    amount: 18500,
    currency: "BDT",
    status: "PENDING",
    verificationStatus: "UNVERIFIED",
    initiatedAt: new Date(),
    completedAt: null,
    failedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: mockOrder,
    events: [],
    refunds: [],
  };

  const mockPrisma: any = {
    db: {
      order: {
        findFirst: jest.fn().mockResolvedValue(mockOrder),
        update: jest.fn().mockResolvedValue(mockOrder),
      },
      paymentTransaction: {
        create: jest.fn().mockResolvedValue(mockTransaction),
        findFirst: jest.fn().mockResolvedValue(mockTransaction),
        findUnique: jest.fn().mockResolvedValue(mockTransaction),
        findMany: jest.fn().mockResolvedValue([mockTransaction]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue({ ...mockTransaction, status: "PAID" }),
      },
      paymentEvent: {
        create: jest.fn().mockResolvedValue({ id: "evt-1" }),
      },
      refund: {
        create: jest.fn().mockResolvedValue({
          id: "ref-1",
          refundRef: "REF-20261108-1111",
          transactionId: "txn-1",
          orderId: "ord-123",
          amount: 5000,
          currency: "BDT",
          reason: "Defect on figure sword blade",
          status: "COMPLETED",
          initiatedBy: "Admin",
          createdAt: new Date(),
          completedAt: new Date(),
        }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((callbackOrArray) => {
        if (typeof callbackOrArray === "function") {
          return callbackOrArray(mockPrisma.db);
        }
        return Promise.all(callbackOrArray);
      }),
    },
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === "NEXT_PUBLIC_APP_URL") return "http://localhost:3000";
      return "";
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        ReconciliationService,
        RefundsService,
        BkashProvider,
        SslcommerzProvider,
        CodProvider,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    reconciliationService = module.get<ReconciliationService>(ReconciliationService);
    refundsService = module.get<RefundsService>(RefundsService);
  });

  describe("Payment Initiation", () => {
    it("initiates bKash payment and returns checkout session", async () => {
      const result = await paymentsService.initiatePayment("usr-456", {
        orderId: "ord-123",
        provider: "BKASH",
      });

      expect(result).toBeDefined();
      expect(result.provider).toBe("BKASH");
      expect(result.amount).toBe(18500);
      expect(result.orderNumber).toBe(mockOrder.orderNumber);
      expect(result.paymentUrl).toContain("provider=BKASH");
    });

    it.each(["SSLCOMMERZ", "COD"] as const)("rejects new %s payments because only bKash is enabled", async provider => {
      await expect(paymentsService.initiatePayment("usr-456", {orderId:"ord-123",provider})).rejects.toThrow("Only bKash is available");
    });
  });

  describe("Callback & Webhook Processing", () => {
    it("handles bKash successful execution callback idempotently", async () => {
      const callbackResult = await paymentsService.handleCallback(
        "BKASH",
        { trxRef: "TXN-20261108-100001", paymentID: "BK-SESSION-123", status: "success" },
        {},
      );

      expect(callbackResult.success).toBe(true);
      expect(callbackResult.status).toBe("PAID");
    });

    it("handles SSLCOMMERZ IPN callback verification", async () => {
      const ipnResult = await paymentsService.handleCallback(
        "SSLCOMMERZ",
        {},
        {
          tran_id: "TXN-20261108-100001",
          val_id: "SSL-123",
          status: "VALID",
          amount: 18500,
        },
      );

      expect(ipnResult.success).toBe(true);
      expect(ipnResult.status).toBe("PAID");
    });
  });

  describe("Reconciliation & Refund Operations", () => {
    it("reconciles pending transaction with gateway", async () => {
      const reconcile = await reconciliationService.reconcileTransaction("TXN-20261108-100001");
      expect(reconcile).toBeDefined();
      expect(reconcile.transactionRef).toBe("TXN-20261108-100001");
      expect(reconcile.message).toBeDefined();
    });

    it("processes admin refund successfully", async () => {
      mockPrisma.db.paymentTransaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        status: "PAID",
      });

      const refund = await refundsService.processRefund("txn-1", {
        amount: 5000,
        reason: "Defect on figure sword blade",
        initiatedBy: "Admin Specialist",
      });

      expect(refund).toBeDefined();
      expect(refund.amount).toBe(5000);
      expect(refund.status).toBe("COMPLETED");
    });

    it("rejects refund if amount exceeds transaction amount", async () => {
      mockPrisma.db.paymentTransaction.findFirst.mockResolvedValueOnce({
        ...mockTransaction,
        status: "PAID",
      });

      await expect(
        refundsService.processRefund("txn-1", {
          amount: 999999,
          reason: "Invalid huge refund",
        }),
      ).rejects.toThrow("exceeds remaining refundable balance");
    });
  });
});
