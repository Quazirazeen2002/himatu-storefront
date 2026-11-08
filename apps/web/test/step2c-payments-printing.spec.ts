import {
  initiatePayment,
  getTransaction,
  getAdminPayments,
  reconcilePayment,
  refundPayment,
  createPrintingRequest,
  getMyPrintingRequests,
  approvePrintingQuotation,
  rejectPrintingQuotation,
  getAdminProductionBoard,
  updateAdminProductionStage,
} from "../src/lib/commerce-api";

describe("Stage 3 Step 2C Commerce & 3D Printing Client API", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("Payments API Client", () => {
    it("calls /payments/initiate with correct payload and headers", async () => {
      const mockResult = {
        transactionRef: "TXN-20261108-100",
        provider: "BKASH",
        paymentUrl: "https://tokenized.sandbox.bka.sh/checkout?id=123",
        status: "PENDING",
        orderNumber: "HMT-1001",
        amount: 15000,
        currency: "BDT",
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });

      const res = await initiatePayment(
        { orderId: "ord-1", provider: "BKASH" },
        "test-token",
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/payments/initiate"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          }),
        }),
      );
      expect(res.transactionRef).toBe("TXN-20261108-100");
    });

    it("queries transaction status via /payments/:ref", async () => {
      const mockTxn = {
        id: "txn-1",
        transactionRef: "TXN-20261108-100",
        status: "PAID",
        amount: 15000,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTxn,
      });

      const res = await getTransaction("TXN-20261108-100");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/payments/TXN-20261108-100"),
        expect.anything(),
      );
      expect(res.status).toBe("PAID");
    });

    it("triggers admin reconciliation and refund operations", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Discrepancy resolved" }),
      });

      const reconcile = await reconcilePayment("admin-token", "txn-1");
      expect(reconcile.message).toBe("Discrepancy resolved");

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "ref-1", status: "COMPLETED", amount: 5000 }),
      });

      const refund = await refundPayment("admin-token", "txn-1", {
        amount: 5000,
        reason: "Customer requested cancellation",
      });
      expect(refund.status).toBe("COMPLETED");
      expect(refund.amount).toBe(5000);
    });
  });

  describe("Custom 3D Printing API Client", () => {
    it("submits customer printing request", async () => {
      const mockReq = {
        id: "req-1",
        requestNumber: "PR-2026-101",
        title: "Luffy Gear 5 Statue",
        status: "SUBMITTED",
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockReq,
      });

      const res = await createPrintingRequest(
        {
          customerName: "Monkey D. Luffy",
          customerEmail: "luffy@strawhat.pirates",
          customerPhone: "01700000000",
          title: "Luffy Gear 5 Statue",
          animeName: "One Piece",
          characterName: "Luffy",
          description: "1/6 scale laughing sun god pose",
        },
        "user-token",
      );

      expect(res.requestNumber).toBe("PR-2026-101");
      expect(res.status).toBe("SUBMITTED");
    });

    it("approves quotation and creates custom manufacturing order", async () => {
      const mockApproval = {
        orderId: "ord-3d-100",
        orderNumber: "HMT-3D-202611-100",
        quotationNumber: "QUO-2026-101",
        depositAmount: 12500,
        totalAmount: 25000,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApproval,
      });

      const res = await approvePrintingQuotation("req-1", "user-token");
      expect(res.orderNumber).toBe("HMT-3D-202611-100");
      expect(res.depositAmount).toBe(12500);
    });

    it("loads Kanban production board and updates figure stage", async () => {
      const mockBoard = {
        stages: ["3D_MODELING", "MODEL_SLICING", "PACKED_FOR_DELIVERY"],
        totalActive: 3,
        columns: { "3D_MODELING": [], "MODEL_SLICING": [] },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBoard,
      });

      const board = await getAdminProductionBoard("admin-token");
      expect(board.totalActive).toBe(3);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "prod-1", stage: "MODEL_SLICING" }),
      });

      const updated = await updateAdminProductionStage("admin-token", "prod-1", {
        stage: "MODEL_SLICING",
      });
      expect(updated.stage).toBe("MODEL_SLICING");
    });
  });
});

