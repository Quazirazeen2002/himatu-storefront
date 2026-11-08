import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService, UploadedFileDto } from "../storage/storage.service";
import type { ProductDto, ProductImageDto } from "@himatu/shared";

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "new" | "name";
  featured?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storageService: StorageService,
  ) {}

  private mapProductToDto(p: any): ProductDto {
    const images: ProductImageDto[] = (p.images || []).map((img: any) => ({
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
      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            description: p.category.description,
            imageUrl: p.category.imageUrl,
            isActive: p.category.isActive,
            displayOrder: p.category.displayOrder,
          }
        : undefined,
      specifications: (p.specifications as Record<string, any>) || null,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      images,
      inventory,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async listPublicProducts(query: ListProductsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    if (query.category?.trim()) {
      const cat = query.category.trim();
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          cat,
        );
      where.category = isUuid
        ? { OR: [{ id: cat }, { slug: cat }] }
        : { slug: cat };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) where.price.lte = Number(query.maxPrice);
    }

    if (query.featured !== undefined) {
      where.isFeatured = query.featured;
    }

    let orderBy: any = [{ createdAt: "desc" }];
    if (query.sort === "price_asc") {
      orderBy = [{ price: "asc" }];
    } else if (query.sort === "price_desc") {
      orderBy = [{ price: "desc" }];
    } else if (query.sort === "name") {
      orderBy = [{ name: "asc" }];
    } else if (query.sort === "new") {
      orderBy = [{ createdAt: "desc" }];
    }

    const [products, total] = await Promise.all([
      this.prisma.db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          },
          inventory: true,
        },
      }),
      this.prisma.db.product.count({ where }),
    ]);

    return {
      items: products.map((p) => this.mapProductToDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getProductBySlug(slug: string): Promise<ProductDto> {
    const product = await this.prisma.db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        inventory: true,
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(`Product not found: ${slug}`);
    }

    return this.mapProductToDto(product);
  }

  async listAdminProducts(query: ListProductsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    if (query.category?.trim()) {
      const cat = query.category.trim();
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          cat,
        );
      where.category = isUuid
        ? { OR: [{ id: cat }, { slug: cat }] }
        : { slug: cat };
    }

    const [products, total] = await Promise.all([
      this.prisma.db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: {
          category: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          },
          inventory: true,
        },
      }),
      this.prisma.db.product.count({ where }),
    ]);

    return {
      items: products.map((p) => this.mapProductToDto(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async createProduct(data: {
    name: string;
    slug: string;
    sku: string;
    shortDescription?: string | null;
    description: string;
    price: number;
    salePrice?: number | null;
    currency?: string;
    categoryId: string;
    specifications?: Record<string, any> | null;
    isActive?: boolean;
    isFeatured?: boolean;
    initialStock?: number;
  }): Promise<ProductDto> {
    const [existingSlug, existingSku, category] = await Promise.all([
      this.prisma.db.product.findUnique({ where: { slug: data.slug } }),
      this.prisma.db.product.findUnique({ where: { sku: data.sku } }),
      this.prisma.db.category.findUnique({ where: { id: data.categoryId } }),
    ]);

    if (existingSlug) {
      throw new ConflictException(`Product slug '${data.slug}' already exists`);
    }
    if (existingSku) {
      throw new ConflictException(`Product SKU '${data.sku}' already exists`);
    }
    if (!category) {
      throw new BadRequestException(`Category with ID '${data.categoryId}' not found`);
    }

    const initialQuantity = Math.max(0, data.initialStock ?? 0);

    const created = await this.prisma.db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          shortDescription: data.shortDescription,
          description: data.description,
          price: data.price,
          salePrice: data.salePrice,
          currency: data.currency || "BDT",
          categoryId: data.categoryId,
          specifications: data.specifications || undefined,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
        },
      });

      await tx.inventory.create({
        data: {
          productId: product.id,
          quantity: initialQuantity,
          reservedQuantity: 0,
        },
      });

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: {
          category: true,
          images: true,
          inventory: true,
        },
      });
    });

    return this.mapProductToDto(created);
  }

  async updateProduct(
    id: string,
    data: {
      name?: string;
      slug?: string;
      sku?: string;
      shortDescription?: string | null;
      description?: string;
      price?: number;
      salePrice?: number | null;
      categoryId?: string;
      specifications?: Record<string, any> | null;
      isActive?: boolean;
      isFeatured?: boolean;
    },
  ): Promise<ProductDto> {
    const product = await this.prisma.db.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    if (data.slug && data.slug !== product.slug) {
      const existing = await this.prisma.db.product.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new ConflictException(`Product slug '${data.slug}' already exists`);
      }
    }

    if (data.sku && data.sku !== product.sku) {
      const existing = await this.prisma.db.product.findUnique({
        where: { sku: data.sku },
      });
      if (existing) {
        throw new ConflictException(`Product SKU '${data.sku}' already exists`);
      }
    }

    if (data.categoryId) {
      const cat = await this.prisma.db.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!cat) {
        throw new BadRequestException(`Category with ID '${data.categoryId}' not found`);
      }
    }

    const updated = await this.prisma.db.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        shortDescription: data.shortDescription,
        description: data.description,
        price: data.price,
        salePrice: data.salePrice,
        categoryId: data.categoryId,
        specifications:
          data.specifications === null
            ? Prisma.JsonNull
            : data.specifications !== undefined
              ? data.specifications
              : undefined,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      },
      include: {
        category: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        inventory: true,
      },
    });

    return this.mapProductToDto(updated);
  }

  async archiveProduct(id: string): Promise<ProductDto> {
    const product = await this.prisma.db.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    // Soft archive: set isActive to false to preserve historical purchase integrity
    const updated = await this.prisma.db.product.update({
      where: { id },
      data: { isActive: false },
      include: {
        category: true,
        images: true,
        inventory: true,
      },
    });

    return this.mapProductToDto(updated);
  }

  async adjustInventory(
    productId: string,
    quantity: number,
    reservedQuantity?: number,
  ) {
    if (quantity < 0) {
      throw new BadRequestException("Inventory quantity cannot be negative");
    }

    const inventory = await this.prisma.db.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory for product ${productId} not found`);
    }

    const nextReserved =
      reservedQuantity !== undefined ? reservedQuantity : inventory.reservedQuantity;

    if (nextReserved < 0) {
      throw new BadRequestException("Reserved quantity cannot be negative");
    }

    if (nextReserved > quantity) {
      throw new BadRequestException(
        `Reserved quantity (${nextReserved}) cannot exceed total quantity (${quantity})`,
      );
    }

    const updated = await this.prisma.db.inventory.update({
      where: { productId },
      data: {
        quantity,
        reservedQuantity: nextReserved,
      },
    });

    return {
      quantity: updated.quantity,
      reservedQuantity: updated.reservedQuantity,
      availableQuantity: updated.quantity - updated.reservedQuantity,
    };
  }

  // IMAGE OPERATIONS
  async addProductImage(
    productId: string,
    file: UploadedFileDto,
    altText?: string,
    isPrimary?: boolean,
  ): Promise<ProductImageDto> {
    const product = await this.prisma.db.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundException(`Product not found: ${productId}`);
    }

    // Upload to Supabase Storage
    const uploaded = await this.storageService.uploadProductImage(productId, file);

    const hasImages = product.images.length > 0;
    const shouldBePrimary = isPrimary ?? !hasImages;

    const result = await this.prisma.db.$transaction(async (tx) => {
      if (shouldBePrimary) {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }

      const nextOrder =
        product.images.reduce((max, img) => Math.max(max, img.sortOrder), -1) + 1;

      return tx.productImage.create({
        data: {
          productId,
          imageUrl: uploaded.publicUrl,
          storagePath: uploaded.storagePath,
          altText: altText || `${product.name} collectible photograph`,
          sortOrder: nextOrder,
          isPrimary: shouldBePrimary,
        },
      });
    });

    return {
      id: result.id,
      productId: result.productId,
      storagePath: result.storagePath,
      imageUrl: result.imageUrl,
      altText: result.altText,
      sortOrder: result.sortOrder,
      isPrimary: result.isPrimary,
    };
  }

  async updateProductImage(
    productId: string,
    imageId: string,
    data: { altText?: string; isPrimary?: boolean },
  ): Promise<ProductImageDto> {
    const image = await this.prisma.db.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException(`Product image not found`);
    }

    const updated = await this.prisma.db.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }

      return tx.productImage.update({
        where: { id: imageId },
        data: {
          altText: data.altText,
          isPrimary: data.isPrimary,
        },
      });
    });

    return {
      id: updated.id,
      productId: updated.productId,
      storagePath: updated.storagePath,
      imageUrl: updated.imageUrl,
      altText: updated.altText,
      sortOrder: updated.sortOrder,
      isPrimary: updated.isPrimary,
    };
  }

  async reorderProductImages(
    productId: string,
    items: Array<{ imageId: string; sortOrder: number }>,
  ) {
    await this.prisma.db.$transaction(
      items.map((item) =>
        this.prisma.db.productImage.updateMany({
          where: { id: item.imageId, productId },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return { success: true };
  }

  async deleteProductImage(productId: string, imageId: string) {
    const image = await this.prisma.db.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException(`Product image not found`);
    }

    // Delete from Supabase Storage if storagePath exists
    if (image.storagePath) {
      await this.storageService.deleteProductImage(image.storagePath);
    }

    await this.prisma.db.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });

      // If deleted image was primary, set another image as primary if exists
      if (image.isPrimary) {
        const nextImage = await tx.productImage.findFirst({
          where: { productId },
          orderBy: { sortOrder: "asc" },
        });
        if (nextImage) {
          await tx.productImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    return { success: true };
  }
}
