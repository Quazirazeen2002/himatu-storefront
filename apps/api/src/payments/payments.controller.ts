import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { PaymentsService } from "./payments.service";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { CurrentUser } from "../auth/roles";

@Controller("payments")
export class PaymentsController {
  constructor(
    @Inject(PaymentsService) private readonly paymentsService: PaymentsService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  private getAppUrl(): string {
    return this.config.get<string>("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  }

  @Post("initiate")
  @UseGuards(OptionalAuthGuard)
  async initiate(
    @CurrentUser() user: { id: string } | null,
    @Body()
    body: {
      orderId: string;
      provider: "BKASH" | "SSLCOMMERZ" | "COD";
      callbackUrl?: string;
    },
  ) {
    return this.paymentsService.initiatePayment(user?.id || null, body);
  }

  @Get(":ref")
  async getTransaction(@Param("ref") ref: string) {
    return this.paymentsService.getTransactionByRef(ref);
  }

  @Get("order/:orderNumber")
  async getOrderTransactions(@Param("orderNumber") orderNumber: string) {
    return this.paymentsService.getTransactions({ search: orderNumber });
  }

  // --- bKash Callbacks ---
  @Get("bkash/callback")
  async bkashCallbackGet(
    @Query() query: any,
    @Res() res: Response,
  ) {
    const result = await this.paymentsService.handleCallback("BKASH", query, {});
    const appUrl = this.getAppUrl();
    const redirectUrl = `${appUrl}/checkout/payment-result?provider=BKASH&trxRef=${encodeURIComponent(
      result.transactionRef,
    )}&orderNumber=${encodeURIComponent(result.orderNumber || "")}&status=${result.status}`;
    return res.redirect(redirectUrl);
  }

  @Post("bkash/callback")
  async bkashCallbackPost(
    @Query() query: any,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const result = await this.paymentsService.handleCallback("BKASH", query, body);
    const appUrl = this.getAppUrl();
    const redirectUrl = `${appUrl}/checkout/payment-result?provider=BKASH&trxRef=${encodeURIComponent(
      result.transactionRef,
    )}&orderNumber=${encodeURIComponent(result.orderNumber || "")}&status=${result.status}`;
    return res.redirect(redirectUrl);
  }

  // --- SSLCOMMERZ Callbacks ---
  @Post("sslcommerz/success")
  async sslcommerzSuccess(@Body() body: any, @Res() res: Response) {
    const result = await this.paymentsService.handleCallback("SSLCOMMERZ", {}, body);
    const appUrl = this.getAppUrl();
    const redirectUrl = `${appUrl}/checkout/payment-result?provider=SSLCOMMERZ&trxRef=${encodeURIComponent(
      result.transactionRef,
    )}&orderNumber=${encodeURIComponent(result.orderNumber || "")}&status=PAID`;
    return res.redirect(redirectUrl);
  }

  @Post("sslcommerz/fail")
  async sslcommerzFail(@Body() body: any, @Res() res: Response) {
    const result = await this.paymentsService.handleCallback("SSLCOMMERZ", {}, { ...body, status: "FAILED" });
    const appUrl = this.getAppUrl();
    const redirectUrl = `${appUrl}/checkout/payment-result?provider=SSLCOMMERZ&trxRef=${encodeURIComponent(
      result.transactionRef,
    )}&orderNumber=${encodeURIComponent(result.orderNumber || "")}&status=FAILED`;
    return res.redirect(redirectUrl);
  }

  @Post("sslcommerz/cancel")
  async sslcommerzCancel(@Body() body: any, @Res() res: Response) {
    const result = await this.paymentsService.handleCallback("SSLCOMMERZ", {}, { ...body, status: "CANCELLED" });
    const appUrl = this.getAppUrl();
    const redirectUrl = `${appUrl}/checkout/payment-result?provider=SSLCOMMERZ&trxRef=${encodeURIComponent(
      result.transactionRef,
    )}&orderNumber=${encodeURIComponent(result.orderNumber || "")}&status=CANCELLED`;
    return res.redirect(redirectUrl);
  }

  @Post("sslcommerz/ipn")
  async sslcommerzIpn(@Body() body: any) {
    const result = await this.paymentsService.handleCallback("SSLCOMMERZ", {}, body);
    return { received: true, status: result.status, transactionRef: result.transactionRef };
  }
}
