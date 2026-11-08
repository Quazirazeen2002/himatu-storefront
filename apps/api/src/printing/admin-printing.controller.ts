import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PrintingService } from "./printing.service";
import { ProductionService } from "./production.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser, Roles, RolesGuard } from "../auth/roles";
import type {
  CreateProductionUpdateDto,
  CreateQuotationDto,
  ProductionStage,
} from "@himatu/shared";

@Controller("admin/printing")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminPrintingController {
  constructor(
    @Inject(PrintingService) private readonly printingService: PrintingService,
    @Inject(ProductionService) private readonly productionService: ProductionService,
  ) {}

  @Get("requests")
  async listRequests(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.printingService.listAllAdmin({
      page: pageNum,
      limit: limitNum,
      status,
      search,
    });
  }

  @Get("requests/:id")
  async getRequestDetail(@Param("id") id: string) {
    return this.printingService.getRequestById(id, undefined, true);
  }

  @Patch("requests/:id/status")
  async updateRequestStatus(
    @Param("id") id: string,
    @Body() body: { status: string; internalNotes?: string },
  ) {
    return this.printingService.updateRequestStatus(id, body.status, body.internalNotes);
  }

  @Post("requests/:id/quotation")
  async createQuotation(
    @Param("id") id: string,
    @CurrentUser() admin: any,
    @Body() body: CreateQuotationDto,
  ) {
    const adminName = admin?.fullName || "Store Owner";
    return this.printingService.createQuotation(id, adminName, body);
  }

  @Get("production")
  async getProductionBoard() {
    return this.productionService.getProductionBoard();
  }

  @Patch("production/:id/stage")
  async updateProductionStage(
    @Param("id") id: string,
    @Body() body: { stage: ProductionStage; notes?: string; assignedTechnician?: string },
  ) {
    return this.productionService.updateStage(id, body);
  }

  @Post("production/:id/updates")
  async addProductionUpdate(
    @Param("id") id: string,
    @CurrentUser() admin: any,
    @Body() body: CreateProductionUpdateDto,
  ) {
    const adminName = admin?.fullName || "Production Technician";
    return this.productionService.addProgressUpdate(id, body, adminName);
  }
}
