import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AuthGuard } from "../auth/auth.guard";
import { Roles, RolesGuard } from "../auth/roles";
import type { OrderStatus, StoreSettingsDto } from "@himatu/shared";

@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get("dashboard/summary")
  async getDashboardSummary(@Query("period") period?: string) {
    return this.adminService.getDashboardSummary(period);
  }

  @Get("dashboard/revenue")
  async getRevenueChart(@Query("period") period?: string) {
    return this.adminService.getRevenueChart(period);
  }

  @Get("dashboard/top-products")
  async getTopProducts(@Query("limit") limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 5;
    return this.adminService.getTopProducts(numLimit);
  }

  @Get("orders")
  async listOrders(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return this.adminService.listAllOrders({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      search,
    });
  }

  @Patch("orders/:id/status")
  async updateOrderStatus(
    @Param("id") id: string,
    @Body() body: { status: OrderStatus; reason?: string },
  ) {
    return this.adminService.updateOrderStatus(id, body.status, body.reason);
  }

  @Get("customers")
  async listCustomers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
  ) {
    return this.adminService.listCustomers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
    });
  }

  @Get("customers/:id")
  async getCustomerDetail(@Param("id") id: string) {
    return this.adminService.getCustomerDetail(id);
  }

  @Get("settings")
  async getSettings() {
    return this.adminService.getStoreSettings();
  }

  @Patch("settings")
  async updateSettings(@Body() body: Partial<StoreSettingsDto>) {
    return this.adminService.updateStoreSettings(body);
  }
}

