import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { AnalyticsService } from "./analytics.service";
import { AiInsightsService } from "./ai-insights.service";
import { AnalyticsController, TelemetryController } from "./analytics.controller";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [AnalyticsController, TelemetryController],
  providers: [AnalyticsService, AiInsightsService],
  exports: [AnalyticsService, AiInsightsService],
})
export class AnalyticsModule {}

