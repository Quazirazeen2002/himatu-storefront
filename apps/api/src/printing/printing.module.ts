import { Module } from "@nestjs/common";
import { PrintingService } from "./printing.service";
import { ProductionService } from "./production.service";
import { PrintingController } from "./printing.controller";
import { AdminPrintingController } from "./admin-printing.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [PrintingController, AdminPrintingController],
  providers: [PrintingService, ProductionService],
  exports: [PrintingService, ProductionService],
})
export class PrintingModule {}

