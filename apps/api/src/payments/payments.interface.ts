import type { PaymentStatus } from "@himatu/shared";

export interface PaymentInitiationParams {
  transactionRef: string;
  orderNumber: string;
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  callbackUrl?: string;
}

export interface PaymentInitiationResult {
  provider: string;
  providerSessionId?: string;
  paymentUrl?: string;
  status: PaymentStatus;
  instructions?: string;
  rawResponse?: any;
}

export interface PaymentVerificationParams {
  providerTransactionId?: string;
  providerSessionId?: string;
  transactionRef: string;
  payload?: any;
}

export interface PaymentVerificationResult {
  verified: boolean;
  status: PaymentStatus;
  providerTransactionId?: string;
  providerSessionId?: string;
  amount: number;
  currency: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface PaymentQueryResult {
  transactionRef: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  completedAt?: Date;
  rawResponse?: any;
}

export interface ProviderRefundParams {
  transactionRef: string;
  providerTransactionId: string;
  amount: number;
  currency: string;
  reason: string;
}

export interface ProviderRefundResult {
  success: boolean;
  providerRefundRef?: string;
  status: string;
  rawResponse?: any;
  errorMessage?: string;
}

export interface IPaymentProvider {
  readonly providerName: string;

  initiate(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;

  verify(params: PaymentVerificationParams): Promise<PaymentVerificationResult>;

  query(providerTransactionId: string, providerSessionId?: string): Promise<PaymentQueryResult>;

  refund(params: ProviderRefundParams): Promise<ProviderRefundResult>;
}

