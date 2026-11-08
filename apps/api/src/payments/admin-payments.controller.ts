import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { ReconciliationService } from "./reconciliation.service";
import { RefundsService } from "./refunds.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser, Roles, RolesGuard } from "../auth/roles";

@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminPaymentsController {
  constructor(
    @Inject(PaymentsService) private readonly paymentsService: PaymentsService,
    @Inject(ReconciliationService) private readonly reconciliationService: ReconciliationService,
    @Inject(RefundsService) private readonly refundsService: RefundsService,
  ) {}

  @Get("payments")
  async listPayments(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("provider") provider?: string,
    @Query("search") search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.paymentsService.getTransactions({
      page: pageNum,
      limit: limitNum,
      status,
      provider,
      search,
    });
  }

  @Get("payments/summary")
  async getPaymentsSummary() {
    return this.paymentsService.getSummary();
  }

  @Get("payments/:id")
  async getPaymentDetail(@Param("id") id: string) {
    return this.paymentsService.getTransactionByRef(id);
  }

  @Post("payments/:id/reconcile")
  async reconcilePayment(@Param("id") id: string) {
    return this.reconciliationService.reconcileTransaction(id);
  }

  @Post("payments/:id/refund")
  async processRefund(
    @Param("id") id: string,
    @CurrentUser() admin: any,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.refundsService.processRefund(id, {
      amount: body.amount,
      reason: body.reason,
      initiatedBy: admin?.fullName || "Admin",
    });
  }

  @Get("refunds")
  async listRefunds(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.refundsService.getRefunds({ page: pageNum, limit: limitNum, search });
  }
}
