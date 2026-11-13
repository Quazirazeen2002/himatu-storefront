import "multer";
import { CategoriesService } from "../categories/categories.service";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ProductsService } from "./products.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard, Roles } from "../auth/roles";
import {
  AdjustInventorySchema,
  CreateProductSchema,
  UpdateProductSchema,
} from "@himatu/shared";

@Controller()
export class ProductsController {
  constructor(
    @Inject(ProductsService) private readonly productsService: ProductsService,
    @Inject(CategoriesService) private readonly categories: CategoriesService,
  ) {}

  // PUBLIC ENDPOINTS
  @Get("products")
  async listPublic(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("productType") productType?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("sort") sort?: "price_asc" | "price_desc" | "new" | "name",
    @Query("featured") featured?: string,
  ) {
    return this.productsService.listPublicProducts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      category,
      productType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      featured: featured === "true" ? true : featured === "false" ? false : undefined,
    });
  }

  @Get("categories/:slug/products")
  async listCategoryProducts(
    @Param("slug") slug: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: "price_asc" | "price_desc" | "new" | "name",
  ) {
    const category = await this.categories.getCategoryBySlug(slug);
    return this.productsService.listPublicProducts({
      ...(category.kind === "PRODUCT_TYPE" ? { productType: slug } : { category: slug }),
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort,
    });
  }

  @Get("products/:slug")
  async getBySlug(@Param("slug") slug: string) {
    return this.productsService.getProductBySlug(slug);
  }

  // ADMIN ENDPOINTS
  @Get("admin/products")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async listAdmin(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("productType") productType?: string,
  ) {
    return this.productsService.listAdminProducts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      category,
      productType,
    });
  }

  @Post("admin/products")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async createProduct(@Body() body: unknown) {
    const parsed = CreateProductSchema.parse(body);
    return this.productsService.createProduct(parsed);
  }

  @Patch("admin/products/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async updateProduct(@Param("id") id: string, @Body() body: unknown) {
    const parsed = UpdateProductSchema.parse(body);
    return this.productsService.updateProduct(id, parsed);
  }

  @Delete("admin/products/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async archiveProduct(@Param("id") id: string) {
    return this.productsService.archiveProduct(id);
  }

  @Delete("admin/products/:id/permanent")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async deleteProduct(@Param("id") id: string) {
    return this.productsService.deleteProduct(id);
  }

  @Post("admin/inventory/:productId/adjust")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async adjustInventory(
    @Param("productId") productId: string,
    @Body() body: unknown,
  ) {
    const parsed = AdjustInventorySchema.parse(body);
    return this.productsService.adjustInventory(
      productId,
      parsed.quantity,
      parsed.reservedQuantity,
    );
  }

  // IMAGE ENDPOINTS
  @Post("admin/products/:productId/images")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  @UseInterceptors(FilesInterceptor("files", 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadImages(
    @Param("productId") productId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body("altText") altText?: string,
    @Body("isPrimary") isPrimary?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one image file is required");
    }

    const uploaded = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.productsService.addProductImage(
        productId,
        file,
        altText,
        isPrimary === "true" && i === 0 ? true : undefined,
      );
      uploaded.push(result);
    }

    return uploaded;
  }

  @Patch("admin/products/:productId/images/reorder")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async reorderImages(
    @Param("productId") productId: string,
    @Body() body: { items: Array<{ imageId: string; sortOrder: number }> },
  ) {
    if (!Array.isArray(body?.items)) {
      throw new BadRequestException("Items array is required for reordering");
    }
    return this.productsService.reorderProductImages(productId, body.items);
  }

  @Patch("admin/products/:productId/images/:imageId")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async updateImage(
    @Param("productId") productId: string,
    @Param("imageId") imageId: string,
    @Body() body: { altText?: string; isPrimary?: boolean },
  ) {
    return this.productsService.updateProductImage(productId, imageId, body);
  }

  @Delete("admin/products/:productId/images/:imageId")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async deleteImage(
    @Param("productId") productId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.productsService.deleteProductImage(productId, imageId);
  }
}
