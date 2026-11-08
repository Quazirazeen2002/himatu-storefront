import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { ProductDto, WishlistDto, WishlistItemDto } from "@himatu/shared";

@Injectable()
export class WishlistService {
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

  async getCustomerWishlist(userId: string): Promise<WishlistDto> {
    let wishlist = await this.prisma.db.wishlist.findUnique({
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

    if (!wishlist) {
      wishlist = await this.prisma.db.wishlist.create({
        data: { userId },
        include: { items: { include: { product: { include: { images: true, inventory: true } } } } },
      });
    }

    const items: WishlistItemDto[] = (wishlist.items || []).map((item) => ({
      id: item.id,
      wishlistId: item.wishlistId,
      productId: item.productId,
      product: this.mapProductToDto(item.product),
      createdAt: item.createdAt.toISOString(),
    }));

    return {
      id: wishlist.id,
      userId: wishlist.userId,
      items,
    };
  }

  async addItem(userId: string, productId: string): Promise<WishlistDto> {
    const product = await this.prisma.db.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException("Product not found or currently unavailable");
    }

    let wishlist = await this.prisma.db.wishlist.findUnique({ where: { userId } });
    if (!wishlist) {
      wishlist = await this.prisma.db.wishlist.create({ data: { userId } });
    }

    // Upsert / avoid duplicate
    await this.prisma.db.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      create: {
        wishlistId: wishlist.id,
        productId,
      },
      update: {},
    });

    return this.getCustomerWishlist(userId);
  }

  async removeItem(userId: string, productId: string): Promise<WishlistDto> {
    const wishlist = await this.prisma.db.wishlist.findUnique({ where: { userId } });
    if (wishlist) {
      await this.prisma.db.wishlistItem.deleteMany({
        where: {
          wishlistId: wishlist.id,
          productId,
        },
      });
    }
    return this.getCustomerWishlist(userId);
  }
}

