import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { ReconciliationService } from "./reconciliation.service";
import { RefundsService } from "./refunds.service";
import { BkashProvider } from "./providers/bkash.provider";
import { SslcommerzProvider } from "./providers/sslcommerz.provider";
import { CodProvider } from "./providers/cod.provider";
import { PaymentsController } from "./payments.controller";
import { AdminPaymentsController } from "./admin-payments.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    PaymentsService,
    ReconciliationService,
    RefundsService,
    BkashProvider,
    SslcommerzProvider,
    CodProvider,
  ],
  exports: [PaymentsService, ReconciliationService, RefundsService],
})
export class PaymentsModule {}

