import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "./payments.service";
import type { RefundDto } from "@himatu/shared";

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PaymentsService) private readonly paymentsService: PaymentsService,
  ) {}

  generateRefundRef(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    return `REF-${datePart}-${random}`;
  }

  async processRefund(
    transactionId: string,
    data: { amount: number; reason: string; initiatedBy?: string },
  ): Promise<RefundDto> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId);
    const txn = await this.prisma.db.paymentTransaction.findFirst({
      where: isUuid ? { id: transactionId } : { transactionRef: transactionId },
      include: {
        order: true,
        refunds: true,
      },
    });

    if (!txn) {
      throw new NotFoundException(`Payment transaction ${transactionId} not found`);
    }

    if (txn.status !== "PAID") {
      throw new ConflictException(
        `Cannot refund transaction in "${txn.status}" status. Only PAID transactions can be refunded.`,
      );
    }

    const previousRefunded = txn.refunds
      .filter((r) => r.status === "COMPLETED")
      .reduce((sum, r) => sum + r.amount, 0);

    const availableToRefund = txn.amount - previousRefunded;

    if (data.amount <= 0) {
      throw new BadRequestException("Refund amount must be greater than zero.");
    }

    if (data.amount > availableToRefund) {
      throw new BadRequestException(
        `Requested refund amount (${data.amount} BDT) exceeds remaining refundable balance (${availableToRefund} BDT).`,
      );
    }

    const provider = this.paymentsService.getProvider(txn.provider);
    const refundRef = this.generateRefundRef();

    const providerResult = await provider.refund({
      transactionRef: txn.transactionRef,
      providerTransactionId: txn.providerTransactionId || txn.transactionRef,
      amount: data.amount,
      currency: txn.currency,
      reason: data.reason,
    });

    if (!providerResult.success) {
      throw new BadRequestException(
        `Payment gateway rejected refund request: ${providerResult.errorMessage || "Unknown gateway error"}`,
      );
    }

    const isFullRefund = previousRefunded + data.amount >= txn.amount;

    const [refundRecord] = await this.prisma.db.$transaction([
      this.prisma.db.refund.create({
        data: {
          refundRef,
          transactionId: txn.id,
          orderId: txn.orderId,
          amount: data.amount,
          currency: txn.currency,
          reason: data.reason,
          providerRefundRef: providerResult.providerRefundRef,
          status: "COMPLETED",
          initiatedBy: data.initiatedBy || "Store Administrator",
          completedAt: new Date(),
        },
      }),
      this.prisma.db.paymentEvent.create({
        data: {
          transactionId: txn.id,
          eventType: "REFUND_ISSUED",
          provider: txn.provider,
          status: "REFUNDED",
          providerEventRef: providerResult.providerRefundRef,
          metadata: {
            refundRef,
            amount: data.amount,
            reason: data.reason,
            isFullRefund,
          },
        },
      }),
      ...(isFullRefund
        ? [
            this.prisma.db.paymentTransaction.update({
              where: { id: txn.id },
              data: { status: "REFUNDED" },
            }),
            ...(txn.orderId
              ? [
                  this.prisma.db.order.update({
                    where: { id: txn.orderId },
                    data: {
                      paymentStatus: "REFUNDED",
                      orderStatus: "CANCELLED",
                    },
                  }),
                ]
              : []),
          ]
        : []),
    ]);

    return {
      id: refundRecord.id,
      refundRef: refundRecord.refundRef,
      transactionId: refundRecord.transactionId,
      orderId: refundRecord.orderId,
      amount: refundRecord.amount,
      currency: refundRecord.currency,
      reason: refundRecord.reason,
      providerRefundRef: refundRecord.providerRefundRef,
      status: refundRecord.status,
      initiatedBy: refundRecord.initiatedBy,
      createdAt: refundRecord.createdAt.toISOString(),
      completedAt: refundRecord.completedAt?.toISOString() || null,
    };
  }

  async getRefunds(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ items: RefundDto[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { refundRef: { contains: params.search, mode: "insensitive" } },
        { providerRefundRef: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.db.refund.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.db.refund.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
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
        createdAt: r.createdAt.toISOString(),
        completedAt: r.completedAt?.toISOString() || null,
      })),
      total,
      page,
      limit,
    };
  }
}
