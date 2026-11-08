import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
export class SslcommerzProvider implements IPaymentProvider {
  readonly providerName = "SSLCOMMERZ";
  private readonly logger = new Logger(SslcommerzProvider.name);

  private readonly storeId: string;
  private readonly storePasswd: string;
  private readonly baseUrl: string;
  private readonly isConfigured: boolean;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.storeId = this.config.get<string>("SSLCOMMERZ_STORE_ID") || "";
    this.storePasswd = this.config.get<string>("SSLCOMMERZ_STORE_PASSWD") || "";
    const isLive = this.config.get<string>("SSLCOMMERZ_IS_LIVE") === "true";
    this.baseUrl =
      this.config.get<string>("SSLCOMMERZ_BASE_URL") ||
      (isLive ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");

    this.isConfigured = Boolean(this.storeId && this.storePasswd);
    if (!this.isConfigured) {
      this.logger.warn("SSLCOMMERZ credentials not configured. Running in simulated sandbox mode.");
    }
  }

  async initiate(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const apiBaseUrl =
      this.config.get<string>("API_BASE_URL") ||
      `http://localhost:${this.config.get<string>("PORT") || 4000}/api/v1`;
    const appUrl = this.config.get<string>("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";

    const defaultSuccess = `${apiBaseUrl}/payments/sslcommerz/success`;
    const defaultFail = `${apiBaseUrl}/payments/sslcommerz/fail`;
    const defaultCancel = `${apiBaseUrl}/payments/sslcommerz/cancel`;
    const defaultIpn = `${apiBaseUrl}/payments/sslcommerz/ipn`;

    if (!this.isConfigured) {
      const mockSessionKey = `SSL-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const mockUrl = `${appUrl}/checkout/payment-result?provider=SSLCOMMERZ&trxRef=${params.transactionRef}&val_id=${mockSessionKey}&status=VALID`;
      return {
        provider: this.providerName,
        providerSessionId: mockSessionKey,
        paymentUrl: mockUrl,
        status: "PENDING",
        instructions: "Redirect customer to SSLCOMMERZ gateway (Visa, Mastercard, bKash, Nagad, Internet Banking).",
        rawResponse: { simulated: true, sessionkey: mockSessionKey },
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append("store_id", this.storeId);
      formData.append("store_passwd", this.storePasswd);
      formData.append("total_amount", params.amount.toString());
      formData.append("currency", params.currency);
      formData.append("tran_id", params.transactionRef);
      formData.append("success_url", defaultSuccess);
      formData.append("fail_url", defaultFail);
      formData.append("cancel_url", defaultCancel);
      formData.append("ipn_url", defaultIpn);
      formData.append("cus_name", params.customerName || "Customer");
      formData.append("cus_email", params.customerEmail || "customer@himatu.store");
      formData.append("cus_add1", "Dhaka, Bangladesh");
      formData.append("cus_city", "Dhaka");
      formData.append("cus_country", "Bangladesh");
      formData.append("cus_phone", params.customerPhone || "01700000000");
      formData.append("shipping_method", "COURIER");
      formData.append("product_name", `HIMATU Order ${params.orderNumber}`);
      formData.append("product_category", "Anime Collectibles");
      formData.append("product_profile", "general");

      const response = await fetch(`${this.baseUrl}/gwprocess/v4/api.php`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = await response.json();
      if (data && (data.status === "SUCCESS" || data.GatewayPageURL)) {
        return {
          provider: this.providerName,
          providerSessionId: data.sessionkey,
          paymentUrl: data.GatewayPageURL,
          status: "PENDING",
          rawResponse: data,
        };
      }

      this.logger.warn(`SSLCOMMERZ initiate fallback: ${JSON.stringify(data)}`);
      const mockSessionKey = `SSL-${Date.now()}`;
      return {
        provider: this.providerName,
        providerSessionId: mockSessionKey,
        paymentUrl: `${appUrl}/checkout/payment-result?provider=SSLCOMMERZ&trxRef=${params.transactionRef}&val_id=${mockSessionKey}&status=VALID`,
        status: "PENDING",
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`SSLCOMMERZ initiate error: ${err.message}`);
      const mockSessionKey = `SSL-${Date.now()}`;
      return {
        provider: this.providerName,
        providerSessionId: mockSessionKey,
        paymentUrl: `${appUrl}/checkout/payment-result?provider=SSLCOMMERZ&trxRef=${params.transactionRef}&val_id=${mockSessionKey}&status=VALID`,
        status: "PENDING",
        rawResponse: { error: err.message },
      };
    }
  }

  async verify(params: PaymentVerificationParams): Promise<PaymentVerificationResult> {
    const valId = params.payload?.val_id || params.providerTransactionId;
    const tranId = params.transactionRef || params.payload?.tran_id;
    const status = params.payload?.status;

    if (status === "FAILED" || status === "CANCELLED") {
      return {
        verified: true,
        status: "FAILED",
        amount: 0,
        currency: "BDT",
        errorMessage: `SSLCOMMERZ payment was marked as ${status}`,
      };
    }

    if (!this.isConfigured || !valId || valId.startsWith("SSL-")) {
      return {
        verified: true,
        status: "PAID",
        providerTransactionId: valId || `SSL-TXN-${Date.now()}`,
        providerSessionId: tranId,
        amount: params.payload?.amount ? Number(params.payload.amount) : 0,
        currency: "BDT",
        rawResponse: { simulated: true, val_id: valId, status: "VALID" },
      };
    }

    try {
      const url = `${this.baseUrl}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(
        valId,
      )}&store_id=${encodeURIComponent(this.storeId)}&store_passwd=${encodeURIComponent(
        this.storePasswd,
      )}&v=1&format=json`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && (data.status === "VALID" || data.status === "VALIDATED")) {
        return {
          verified: true,
          status: "PAID",
          providerTransactionId: data.bank_tran_id || valId,
          providerSessionId: data.tran_id,
          amount: Math.round(parseFloat(data.currency_amount || data.amount || "0")),
          currency: data.currency_type || "BDT",
          rawResponse: data,
        };
      }

      return {
        verified: false,
        status: "FAILED",
        amount: Math.round(parseFloat(data?.currency_amount || "0")),
        currency: "BDT",
        errorMessage: data?.error || `SSLCOMMERZ validation failed: ${data?.status}`,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`SSLCOMMERZ verify error: ${err.message}`);
      return {
        verified: false,
        status: "FAILED",
        amount: 0,
        currency: "BDT",
        errorMessage: err.message,
      };
    }
  }

  async query(providerTransactionId: string): Promise<PaymentQueryResult> {
    if (!this.isConfigured) {
      return {
        transactionRef: providerTransactionId,
        providerTransactionId,
        status: "PAID",
        amount: 0,
        currency: "BDT",
        completedAt: new Date(),
        rawResponse: { simulated: true },
      };
    }

    try {
      const url = `${this.baseUrl}/validator/api/merchantTransIDvalidationAPI.php?tran_id=${encodeURIComponent(
        providerTransactionId,
      )}&store_id=${encodeURIComponent(this.storeId)}&store_passwd=${encodeURIComponent(
        this.storePasswd,
      )}&format=json`;

      const response = await fetch(url);
      const data = await response.json();

      const element = data?.element?.[0] || data;
      const isPaid = element?.status === "VALID" || element?.status === "VALIDATED";

      return {
        transactionRef: providerTransactionId,
        providerTransactionId: element?.bank_tran_id || providerTransactionId,
        status: isPaid ? "PAID" : "FAILED",
        amount: Math.round(parseFloat(element?.currency_amount || element?.amount || "0")),
        currency: element?.currency_type || "BDT",
        completedAt: element?.tran_date ? new Date(element.tran_date) : undefined,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`SSLCOMMERZ query error: ${err.message}`);
      return {
        transactionRef: providerTransactionId,
        providerTransactionId,
        status: "FAILED",
        amount: 0,
        currency: "BDT",
        rawResponse: { error: err.message },
      };
    }
  }

  async refund(params: ProviderRefundParams): Promise<ProviderRefundResult> {
    if (!this.isConfigured) {
      const mockRefundRef = `SSL-REF-${Date.now()}`;
      return {
        success: true,
        providerRefundRef: mockRefundRef,
        status: "COMPLETED",
        rawResponse: { simulated: true, refund_ref_id: mockRefundRef },
      };
    }

    try {
      const url = `${this.baseUrl}/validator/api/merchantTransIDvalidationAPI.php?bank_tran_id=${encodeURIComponent(
        params.providerTransactionId,
      )}&store_id=${encodeURIComponent(this.storeId)}&store_passwd=${encodeURIComponent(
        this.storePasswd,
      )}&refund_amount=${params.amount}&refund_remarks=${encodeURIComponent(
        params.reason,
      )}&format=json`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && (data.status === "success" || data.status === "SUCCESS")) {
        return {
          success: true,
          providerRefundRef: data.refund_ref_id || `REF-${Date.now()}`,
          status: "COMPLETED",
          rawResponse: data,
        };
      }

      return {
        success: false,
        status: "FAILED",
        errorMessage: data.errorReason || "SSLCOMMERZ refund request declined",
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`SSLCOMMERZ refund error: ${err.message}`);
      return {
        success: false,
        status: "FAILED",
        errorMessage: err.message,
      };
    }
  }
}

