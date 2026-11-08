import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/roles";
import { CancelOrderSchema, CreateOrderSchema } from "@himatu/shared";

@Controller("orders")
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @CurrentUser() customer: { id: string },
    @Body() body: unknown,
  ) {
    const parsed = CreateOrderSchema.parse(body);
    return this.ordersService.createOrder(customer.id, parsed);
  }

  @Get()
  async listOrders(@CurrentUser() customer: { id: string }) {
    return this.ordersService.listCustomerOrders(customer.id);
  }

  @Get(":orderNumber")
  async getOrder(
    @CurrentUser() customer: { id: string; role?: string },
    @Param("orderNumber") orderNumber: string,
  ) {
    return this.ordersService.getOrderByNumber(
      customer.id,
      orderNumber,
      customer.role,
    );
  }

  @Post(":orderNumber/cancel")
  async cancelOrder(
    @CurrentUser() customer: { id: string },
    @Param("orderNumber") orderNumber: string,
    @Body() body: unknown,
  ) {
    const parsed = CancelOrderSchema.parse(body);
    return this.ordersService.cancelOrder(customer.id, orderNumber, parsed.reason);
  }
}

