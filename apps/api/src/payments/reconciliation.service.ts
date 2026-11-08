import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "./payments.service";

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PaymentsService) private readonly paymentsService: PaymentsService,
  ) {}

  async reconcileTransaction(transactionId: string): Promise<{
    transactionRef: string;
    previousStatus: string;
    newStatus: string;
    discrepancyFound: boolean;
    verificationStatus: string;
    message: string;
  }> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId);
    const txn = await this.prisma.db.paymentTransaction.findFirst({
      where: isUuid ? { id: transactionId } : { transactionRef: transactionId },
      include: { order: true },
    });

    if (!txn) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    const previousStatus = txn.status;
    const provider = this.paymentsService.getProvider(txn.provider);

    try {
      const queryResult = await provider.query(
        txn.providerTransactionId || txn.transactionRef,
        txn.providerSessionId || undefined,
      );

      const discrepancyFound = queryResult.status !== txn.status;
      let newStatus = txn.status;
      let verificationStatus = txn.verificationStatus;

      if (queryResult.status === "PAID" && txn.status !== "PAID") {
        newStatus = "PAID";
        verificationStatus = "VERIFIED";

        await this.prisma.db.$transaction([
          this.prisma.db.paymentTransaction.update({
            where: { id: txn.id },
            data: {
              status: "PAID",
              verificationStatus: "VERIFIED",
              completedAt: queryResult.completedAt || new Date(),
              providerTransactionId: queryResult.providerTransactionId || txn.providerTransactionId,
            },
          }),
          this.prisma.db.paymentEvent.create({
            data: {
              transactionId: txn.id,
              eventType: "RECONCILIATION_MATCH",
              provider: txn.provider,
              status: "PAID",
              verificationResult: "VERIFIED_VIA_RECONCILIATION",
              metadata: queryResult.rawResponse || {},
            },
          }),
          ...(txn.orderId
            ? [
                this.prisma.db.order.update({
                  where: { id: txn.orderId },
                  data: {
                    paymentStatus: "PAID",
                    orderStatus: "CONFIRMED",
                  },
                }),
              ]
            : []),
        ]);
      } else if (queryResult.status === "FAILED" && txn.status === "PENDING") {
        newStatus = "FAILED";
        verificationStatus = "FAILED";

        await this.prisma.db.$transaction([
          this.prisma.db.paymentTransaction.update({
            where: { id: txn.id },
            data: {
              status: "FAILED",
              verificationStatus: "FAILED",
              failedAt: new Date(),
            },
          }),
          this.prisma.db.paymentEvent.create({
            data: {
              transactionId: txn.id,
              eventType: "RECONCILIATION_FAILURE",
              provider: txn.provider,
              status: "FAILED",
              verificationResult: "RECONCILED_FAILED",
              metadata: queryResult.rawResponse || {},
            },
          }),
        ]);
      } else {
        // Log event that reconciliation checked and matched current status
        await this.prisma.db.paymentEvent.create({
          data: {
            transactionId: txn.id,
            eventType: "RECONCILIATION_CHECK",
            provider: txn.provider,
            status: txn.status,
            verificationResult: "STATUS_CONFIRMED",
            metadata: queryResult.rawResponse || {},
          },
        });
      }

      return {
        transactionRef: txn.transactionRef,
        previousStatus,
        newStatus,
        discrepancyFound,
        verificationStatus,
        message: discrepancyFound
          ? `Discrepancy resolved. Status updated from ${previousStatus} to ${newStatus}.`
          : `Gateway status verified. Transaction is in correct state (${newStatus}).`,
      };
    } catch (err: any) {
      this.logger.error(`Reconciliation failed for ${txn.transactionRef}: ${err.message}`);
      return {
        transactionRef: txn.transactionRef,
        previousStatus,
        newStatus: previousStatus,
        discrepancyFound: false,
        verificationStatus: txn.verificationStatus,
        message: `Gateway reconciliation check failed: ${err.message}`,
      };
    }
  }
}
