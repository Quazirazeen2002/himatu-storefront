import {
  Controller,
  Get,
  Inject,
  Module,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  @Get()
  @ApiOperation({ summary: "Application and database readiness" })
  async get() {
    const database = await this.prisma.status();
    if (database !== "up")
      throw new ServiceUnavailableException({ status: "degraded", database });
    return { status: "ok", database };
  }
}
@Module({ controllers: [HealthController] })
export class HealthModule {}
