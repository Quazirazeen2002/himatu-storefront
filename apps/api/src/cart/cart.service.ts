import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CartDto, CartItemDto, ProductDto } from "@himatu/shared";

@Injectable()
export class CartService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private mapProductToDto(p: any): ProductDto {
    const images = (p.images || []).map((img: any) => ({
      id: img.id,
      productId: img.productId,
      storagePath: img.storagePath,
      imageUrl: img.imageUrl,
      altText: img.altText,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    }));

    const inventory = p.inventory
      ? {
          quantity: p.inventory.quantity,
          reservedQuantity: p.inventory.reservedQuantity,
          availableQuantity: Math.max(
            0,
            p.inventory.quantity - p.inventory.reservedQuantity,
          ),
        }
      : null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      shortDescription: p.shortDescription,
      description: p.description,
      price: p.price,
      salePrice: p.salePrice,
      currency: p.currency,
      categoryId: p.categoryId,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      images,
      inventory,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private mapCartToDto(cart: any): CartDto {
    let subtotal = 0;
    let itemCount = 0;
    let hasStockIssue = false;

    const items: CartItemDto[] = (cart.items || []).map((item: any) => {
      const product = this.mapProductToDto(item.product);
      const effectivePrice = product.salePrice || product.price;
      subtotal += effectivePrice * item.quantity;
      itemCount += item.quantity;

      const availableStock = product.inventory?.availableQuantity ?? 0;
      if (item.quantity > availableStock) {
        hasStockIssue = true;
      }

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        product,
        quantity: item.quantity,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      subtotal,
      itemCount,
      hasStockIssue,
    };
  }

  async getCustomerCart(userId: string): Promise<CartDto> {
    let cart = await this.prisma.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                },
                inventory: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.db.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                  inventory: true,
                },
              },
            },
          },
        },
      });
    }

    return this.mapCartToDto(cart);
  }

  async addItem(userId: string, productId: string, quantity = 1): Promise<CartDto> {
    if (quantity <= 0) {
      throw new BadRequestException("Quantity must be greater than zero");
    }

    const product = await this.prisma.db.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException("Product not found or currently unavailable");
    }

    const available = product.inventory
      ? product.inventory.quantity - product.inventory.reservedQuantity
      : 0;

    let cart = await this.prisma.db.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.db.cart.create({ data: { userId } });
    }

    const existingItem = await this.prisma.db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (targetQuantity > available) {
      throw new ConflictException(
        `Requested quantity (${targetQuantity}) exceeds available stock (${available}) for ${product.name}`,
      );
    }

    if (existingItem) {
      await this.prisma.db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: targetQuantity },
      });
    } else {
      await this.prisma.db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: targetQuantity,
        },
      });
    }

    return this.getCustomerCart(userId);
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartDto> {
    if (quantity <= 0) {
      return this.removeItem(userId, itemId);
    }

    const cart = await this.prisma.db.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException("Cart not found");

    const item = await this.prisma.db.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: { include: { inventory: true } } },
    });

    if (!item) {
      throw new NotFoundException("Item not found in customer cart");
    }

    const available = item.product.inventory
      ? item.product.inventory.quantity - item.product.inventory.reservedQuantity
      : 0;

    if (quantity > available) {
      throw new ConflictException(
        `Requested quantity (${quantity}) exceeds available stock (${available})`,
      );
    }

    await this.prisma.db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCustomerCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<CartDto> {
    const cart = await this.prisma.db.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException("Cart not found");

    await this.prisma.db.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    return this.getCustomerCart(userId);
  }

  async clearCart(userId: string): Promise<{ success: boolean }> {
    const cart = await this.prisma.db.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.db.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { success: true };
  }
}

