import { Injectable } from "@nestjs/common";
import type {
  IPaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentQueryResult,
  PaymentVerificationParams,
  PaymentVerificationResult,
  ProviderRefundParams,
  ProviderRefundResult,
} from "../payments.interface";

@Injectable()
export class CodProvider implements IPaymentProvider {
  readonly providerName = "COD";

  async initiate(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    return {
      provider: this.providerName,
      status: "PENDING",
      instructions: "Cash will be collected by courier upon physical delivery.",
      rawResponse: { mode: "Cash on Delivery", orderNumber: params.orderNumber },
    };
  }

  async verify(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    // COD is marked PAID manually by store admin or automated courier sync
    const isSettled = params.payload?.status === "PAID" || params.payload?.settled === true;
    return {
      verified: true,
      status: isSettled ? "PAID" : "PENDING",
      providerTransactionId: `COD-${params.transactionRef}`,
      amount: params.payload?.amount || 0,
      currency: "BDT",
      rawResponse: { mode: "COD", settled: isSettled },
    };
  }

  async query(providerTransactionId: string): Promise<PaymentQueryResult> {
    return {
      transactionRef: providerTransactionId,
      providerTransactionId,
      status: "PENDING",
      amount: 0,
      currency: "BDT",
      rawResponse: { mode: "COD" },
    };
  }

  async refund(params: ProviderRefundParams): Promise<ProviderRefundResult> {
    return {
      success: true,
      providerRefundRef: `COD-CASH-REF-${Date.now()}`,
      status: "COMPLETED",
      rawResponse: { mode: "COD_MANUAL_REFUND", reason: params.reason },
    };
  }
}

