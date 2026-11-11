import "multer";
import { FileInterceptor } from "@nestjs/platform-express";
import { StorageService } from "../storage/storage.service";
import {
  Body,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard, Roles } from "../auth/roles";
import { CreateCategorySchema, UpdateCategorySchema } from "@himatu/shared";

@Controller()
export class CategoriesController {
  constructor(
    @Inject(CategoriesService)
    private readonly categoriesService: CategoriesService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  @Get("categories")
  async listPublic() {
    return this.categoriesService.listPublicCategories();
  }

  @Get("admin/categories")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async listAdmin() { return this.categoriesService.listAdminCategories(); }

  @Post("admin/categories/:id/image")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadImage(@Param("id", new ParseUUIDPipe()) id: string, @UploadedFile() file: Express.Multer.File, @Body("imageIsDemo") demoFlag?: string) {
    if (!file) throw new BadRequestException("Select a JPEG, PNG or WebP image.");
    await this.categoriesService.listAdminCategories().then(categories => {
      if (!categories.some(category => category.id === id)) throw new BadRequestException("Category does not exist.");
    });
    const stored = await this.storage.uploadCategoryImage(id, file);
    try { return await this.categoriesService.setCategoryImage(id, stored.publicUrl, demoFlag === "true"); }
    catch (error) { await this.storage.deleteProductImage(stored.storagePath); throw error; }
  }

  @Post("admin/categories")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async createCategory(@Body() body: unknown) {
    const parsed = CreateCategorySchema.parse(body);
    return this.categoriesService.createCategory(parsed);
  }

  @Patch("admin/categories/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  async updateCategory(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const parsed = UpdateCategorySchema.parse(body);
    return this.categoriesService.updateCategory(id, parsed);
  }
}
