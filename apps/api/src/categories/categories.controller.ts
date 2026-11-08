import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
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
  ) {}

  @Get("categories")
  async listPublic() {
    return this.categoriesService.listPublicCategories();
  }

  @Post("admin/categories")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async createCategory(@Body() body: unknown) {
    const parsed = CreateCategorySchema.parse(body);
    return this.categoriesService.createCategory(parsed);
  }

  @Patch("admin/categories/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  async updateCategory(@Param("id") id: string, @Body() body: unknown) {
    const parsed = UpdateCategorySchema.parse(body);
    return this.categoriesService.updateCategory(id, parsed);
  }
}
