import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BkashProvider } from "./providers/bkash.provider";
import { SslcommerzProvider } from "./providers/sslcommerz.provider";
import { CodProvider } from "./providers/cod.provider";
import type {
  PaymentInitiationResultDto,
  PaymentTransactionDto,
} from "@himatu/shared";
import type { IPaymentProvider } from "./payments.interface";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers: Map<string, IPaymentProvider> = new Map();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(BkashProvider) private readonly bkashProvider: BkashProvider,
    @Inject(SslcommerzProvider) private readonly sslcommerzProvider: SslcommerzProvider,
    @Inject(CodProvider) private readonly codProvider: CodProvider,
  ) {
    this.providers.set("BKASH", bkashProvider);
    this.providers.set("SSLCOMMERZ", sslcommerzProvider);
    this.providers.set("COD", codProvider);
  }

  getProvider(providerName: string): IPaymentProvider {
    const provider = this.providers.get(providerName.toUpperCase());
    if (!provider) {
      throw new BadRequestException(`Unsupported payment provider: ${providerName}`);
    }
    return provider;
  }

  generateTransactionRef(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const random = Math.floor(100000 + Math.random() * 900000);
    return `TXN-${datePart}-${random}`;
  }

  async initiatePayment(
    userId: string | null,
    data: {
      orderId: string;
      provider: "BKASH" | "SSLCOMMERZ" | "COD";
      callbackUrl?: string;
    },
  ): Promise<PaymentInitiationResultDto> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.orderId);
    const order = await this.prisma.db.order.findFirst({
      where: isUuid ? { id: data.orderId } : { orderNumber: data.orderId },
      include: {
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order not found: ${data.orderId}`);
    }

    if (order.paymentStatus === "PAID") {
      throw new BadRequestException("Order has already been paid in full.");
    }

    if (order.orderStatus === "CANCELLED") {
      throw new ConflictException("Cannot initiate payment for a cancelled order.");
    }

    const providerInstance = this.getProvider(data.provider);
    const transactionRef = this.generateTransactionRef();

    const address = order.addressSnapshot as any;
    const customerName = order.user?.fullName || address?.recipientName || "HIMATU Collector";
    const customerEmail = order.user?.email || "customer@himatu.store";
    const customerPhone = order.user?.phone || address?.phone || "01700000000";

    const initiation = await providerInstance.initiate({
      transactionRef,
      orderNumber: order.orderNumber,
      orderId: order.id,
      amount: order.totalAmount,
      currency: order.currency,
      customerName,
      customerEmail,
      customerPhone,
      callbackUrl: data.callbackUrl,
    });

    const paymentMethodMapped =
      data.provider === "BKASH" ? "BKASH" : data.provider === "SSLCOMMERZ" ? "CARD" : "COD";

    await this.prisma.db.paymentTransaction.create({
      data: {
        transactionRef,
        orderId: order.id,
        userId: order.userId || userId,
        provider: data.provider,
        paymentMethod: paymentMethodMapped,
        providerSessionId: initiation.providerSessionId || null,
        amount: order.totalAmount,
        currency: order.currency,
        status: "PENDING",
        verificationStatus: "UNVERIFIED",
        paymentDetails: initiation.rawResponse || null,
        events: {
          create: {
            eventType: "PAYMENT_INITIATED",
            provider: data.provider,
            status: "PENDING",
            metadata: {
              orderNumber: order.orderNumber,
              amount: order.totalAmount,
              session: initiation.providerSessionId,
            },
          },
        },
      },
    });

    // Also update order payment method
    await this.prisma.db.order.update({
      where: { id: order.id },
      data: { paymentMethod: paymentMethodMapped },
    });

    return {
      transactionRef,
      provider: data.provider,
      paymentUrl: initiation.paymentUrl,
      status: "PENDING",
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      currency: order.currency,
      instructions: initiation.instructions,
    };
  }

  async handleCallback(
    providerName: string,
    queryParams: any = {},
    bodyParams: any = {},
  ): Promise<{ success: boolean; transactionRef: string; orderNumber?: string; status: string; message?: string }> {
    const combined = { ...queryParams, ...bodyParams };
    const trxRef =
      combined.trxRef ||
      combined.tran_id ||
      combined.merchantInvoiceNumber ||
      combined.transactionRef;
    const paymentId = combined.paymentID || combined.val_id || combined.sessionkey;

    let transaction = await this.prisma.db.paymentTransaction.findFirst({
      where: {
        OR: [
          ...(trxRef ? [{ transactionRef: trxRef }] : []),
          ...(paymentId ? [{ providerSessionId: paymentId }] : []),
        ],
      },
      include: {
        order: true,
      },
    });

    if (!transaction) {
      this.logger.error(`Callback transaction not found for ref ${trxRef} or id ${paymentId}`);
      return {
        success: false,
        transactionRef: trxRef || "UNKNOWN",
        status: "FAILED",
        message: "Transaction record not found",
      };
    }

    // Idempotency: if already paid, return early
    if (transaction.status === "PAID") {
      return {
        success: true,
        transactionRef: transaction.transactionRef,
        orderNumber: transaction.order?.orderNumber,
        status: "PAID",
      };
    }

    const providerInstance = this.getProvider(providerName);
    const verification = await providerInstance.verify({
      transactionRef: transaction.transactionRef,
      providerTransactionId: combined.val_id || combined.trxID,
      providerSessionId: transaction.providerSessionId || paymentId,
      payload: combined,
    });

    if (verification.verified && verification.status === "PAID") {
      await this.prisma.db.$transaction([
        this.prisma.db.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "PAID",
            verificationStatus: "VERIFIED",
            completedAt: new Date(),
            providerTransactionId: verification.providerTransactionId || combined.trxID || combined.val_id,
            paymentDetails: verification.rawResponse || combined,
          },
        }),
        this.prisma.db.paymentEvent.create({
          data: {
            transactionId: transaction.id,
            eventType: "PAYMENT_SUCCESS",
            provider: providerName,
            status: "PAID",
            verificationResult: "VERIFIED",
            providerEventRef: verification.providerTransactionId,
            metadata: verification.rawResponse || combined,
          },
        }),
        ...(transaction.orderId
          ? [
              this.prisma.db.order.update({
                where: { id: transaction.orderId },
                data: {
                  paymentStatus: "PAID",
                  orderStatus: "CONFIRMED",
                },
              }),
            ]
          : []),
      ]);

      return {
        success: true,
        transactionRef: transaction.transactionRef,
        orderNumber: transaction.order?.orderNumber,
        status: "PAID",
      };
    } else {
      await this.prisma.db.$transaction([
        this.prisma.db.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            verificationStatus: "FAILED",
            failedAt: new Date(),
            paymentDetails: verification.rawResponse || combined,
          },
        }),
        this.prisma.db.paymentEvent.create({
          data: {
            transactionId: transaction.id,
            eventType: "PAYMENT_FAILED",
            provider: providerName,
            status: "FAILED",
            verificationResult: "FAILED",
            metadata: { error: verification.errorMessage, raw: combined },
          },
        }),
      ]);

      return {
        success: false,
        transactionRef: transaction.transactionRef,
        orderNumber: transaction.order?.orderNumber,
        status: "FAILED",
        message: verification.errorMessage || "Payment verification failed",
      };
    }
  }

  async getTransactionByRef(ref: string): Promise<PaymentTransactionDto> {
    const txn = await this.prisma.db.paymentTransaction.findUnique({
      where: { transactionRef: ref },
      include: {
        order: true,
        user: true,
        events: { orderBy: { createdAt: "desc" } },
        refunds: true,
      },
    });

    if (!txn) {
      throw new NotFoundException(`Transaction ${ref} not found`);
    }

    return this.mapToDto(txn);
  }

  async getTransactions(params: {
    page?: number;
    limit?: number;
    status?: string;
    provider?: string;
    search?: string;
    userId?: string;
  }): Promise<{ items: PaymentTransactionDto[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.provider) where.provider = params.provider;
    if (params.userId) where.userId = params.userId;
    if (params.search) {
      where.OR = [
        { transactionRef: { contains: params.search, mode: "insensitive" } },
        { providerTransactionId: { contains: params.search, mode: "insensitive" } },
        { order: { orderNumber: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.db.paymentTransaction.findMany({
        where,
        include: {
          order: true,
          user: true,
          refunds: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.db.paymentTransaction.count({ where }),
    ]);

    return {
      items: items.map((i) => this.mapToDto(i)),
      total,
      page,
      limit,
    };
  }

  async getSummary(): Promise<{
    totalVolume: number;
    totalTransactions: number;
    paidVolume: number;
    paidCount: number;
    pendingCount: number;
    failedCount: number;
    refundedVolume: number;
    byProvider: Array<{ provider: string; count: number; volume: number }>;
  }> {
    const transactions = await this.prisma.db.paymentTransaction.findMany();
    const refunds = await this.prisma.db.refund.findMany({ where: { status: "COMPLETED" } });

    let totalVolume = 0;
    let paidVolume = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    const providerMap = new Map<string, { count: number; volume: number }>();

    for (const t of transactions) {
      totalVolume += t.amount;
      if (t.status === "PAID") {
        paidVolume += t.amount;
        paidCount++;
      } else if (t.status === "PENDING") {
        pendingCount++;
      } else if (t.status === "FAILED") {
        failedCount++;
      }

      const p = providerMap.get(t.provider) || { count: 0, volume: 0 };
      p.count++;
      if (t.status === "PAID") p.volume += t.amount;
      providerMap.set(t.provider, p);
    }

    const refundedVolume = refunds.reduce((sum, r) => sum + r.amount, 0);

    const byProvider = Array.from(providerMap.entries()).map(([provider, data]) => ({
      provider,
      count: data.count,
      volume: data.volume,
    }));

    return {
      totalVolume,
      totalTransactions: transactions.length,
      paidVolume,
      paidCount,
      pendingCount,
      failedCount,
      refundedVolume,
      byProvider,
    };
  }

  mapToDto(txn: any): PaymentTransactionDto {
    return {
      id: txn.id,
      transactionRef: txn.transactionRef,
      orderId: txn.orderId,
      orderNumber: txn.order?.orderNumber || null,
      userId: txn.userId,
      customerName: txn.user?.fullName || null,
      customerEmail: txn.user?.email || null,
      provider: txn.provider,
      paymentMethod: txn.paymentMethod,
      providerTransactionId: txn.providerTransactionId,
      providerSessionId: txn.providerSessionId,
      providerReference: txn.providerReference,
      amount: txn.amount,
      currency: txn.currency,
      status: txn.status,
      verificationStatus: txn.verificationStatus,
      paymentDetails: txn.paymentDetails,
      initiatedAt: txn.initiatedAt?.toISOString?.() || String(txn.initiatedAt),
      completedAt: txn.completedAt ? (txn.completedAt.toISOString?.() || String(txn.completedAt)) : null,
      failedAt: txn.failedAt ? (txn.failedAt.toISOString?.() || String(txn.failedAt)) : null,
      createdAt: txn.createdAt?.toISOString?.() || String(txn.createdAt),
      updatedAt: txn.updatedAt?.toISOString?.() || String(txn.updatedAt),
      events: txn.events?.map((e: any) => ({
        id: e.id,
        transactionId: e.transactionId,
        eventType: e.eventType,
        provider: e.provider,
        providerEventRef: e.providerEventRef,
        status: e.status,
        verificationResult: e.verificationResult,
        metadata: e.metadata,
        createdAt: e.createdAt?.toISOString?.() || String(e.createdAt),
      })),
      refunds: txn.refunds?.map((r: any) => ({
        id: r.id,
        refundRef: r.refundRef,
        transactionId: r.transactionId,
        orderId: r.orderId,
        amount: r.amount,
        currency: r.currency,
        reason: r.reason,
        providerRefundRef: r.providerRefundRef,
        status: r.status,
        initiatedBy: r.initiatedBy,
        createdAt: r.createdAt?.toISOString?.() || String(r.createdAt),
        completedAt: r.completedAt ? (r.completedAt.toISOString?.() || String(r.completedAt)) : null,
      })),
    };
  }
}
