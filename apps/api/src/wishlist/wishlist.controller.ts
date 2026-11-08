import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/roles";
import { z } from "zod";

const AddWishlistSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

@Controller("wishlist")
@UseGuards(AuthGuard)
export class WishlistController {
  constructor(
    @Inject(WishlistService) private readonly wishlistService: WishlistService,
  ) {}

  @Get()
  async getWishlist(@CurrentUser() customer: { id: string }) {
    return this.wishlistService.getCustomerWishlist(customer.id);
  }

  @Post("items")
  async addItem(
    @CurrentUser() customer: { id: string },
    @Body() body: unknown,
  ) {
    const parsed = AddWishlistSchema.parse(body);
    return this.wishlistService.addItem(customer.id, parsed.productId);
  }

  @Delete("items/:productId")
  async removeItem(
    @CurrentUser() customer: { id: string },
    @Param("productId") productId: string,
  ) {
    return this.wishlistService.removeItem(customer.id, productId);
  }
}

