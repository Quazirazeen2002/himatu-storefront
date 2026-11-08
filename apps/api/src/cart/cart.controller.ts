import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/roles";
import { AddCartItemSchema, UpdateCartItemSchema } from "@himatu/shared";

@Controller("cart")
@UseGuards(AuthGuard)
export class CartController {
  constructor(@Inject(CartService) private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() customer: { id: string }) {
    return this.cartService.getCustomerCart(customer.id);
  }

  @Post("items")
  async addItem(
    @CurrentUser() customer: { id: string },
    @Body() body: unknown,
  ) {
    const parsed = AddCartItemSchema.parse(body);
    return this.cartService.addItem(customer.id, parsed.productId, parsed.quantity);
  }

  @Patch("items/:itemId")
  async updateItem(
    @CurrentUser() customer: { id: string },
    @Param("itemId") itemId: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateCartItemSchema.parse(body);
    return this.cartService.updateItemQuantity(customer.id, itemId, parsed.quantity);
  }

  @Delete("items/:itemId")
  async removeItem(
    @CurrentUser() customer: { id: string },
    @Param("itemId") itemId: string,
  ) {
    return this.cartService.removeItem(customer.id, itemId);
  }

  @Delete()
  async clearCart(@CurrentUser() customer: { id: string }) {
    return this.cartService.clearCart(customer.id);
  }
}

