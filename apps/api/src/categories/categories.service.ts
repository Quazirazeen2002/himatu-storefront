import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CategoryDto, CategoryKind, FranchiseFamily } from "@himatu/shared";
import type { Category } from "../generated/prisma/client";

interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  imageIsDemo?: boolean;
  kind?: CategoryKind;
  family?: FranchiseFamily | null;
  isActive?: boolean;
  displayOrder?: number;
}
const defaultCover = "/images/categories/category-default.svg";
const counts = { select: { products: { where: { isActive: true } }, typedProducts: { where: { isActive: true } } } } as const;

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private dto(category: Category & { _count?: { products: number; typedProducts: number } }): CategoryDto {
    return {
      id: category.id, name: category.name, slug: category.slug, description: category.description,
      imageUrl: category.imageUrl, imageIsDemo: category.imageIsDemo, kind: category.kind, family: category.family,
      isActive: category.isActive, displayOrder: category.displayOrder,
      productCount: category._count ? (category.kind === "PRODUCT_TYPE" ? category._count.typedProducts : category._count.products) : 0,
    };
  }
  async listPublicCategories(): Promise<CategoryDto[]> {
    return (await this.prisma.db.category.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }], include: { _count: counts } })).map(category => this.dto(category));
  }
  async listAdminCategories(): Promise<CategoryDto[]> {
    return (await this.prisma.db.category.findMany({ orderBy: [{ kind: "asc" }, { displayOrder: "asc" }], include: { _count: counts } })).map(category => this.dto(category));
  }
  async getCategoryBySlug(slug: string): Promise<CategoryDto> {
    const category = await this.prisma.db.category.findUnique({ where: { slug }, include: { _count: counts } });
    if (!category || !category.isActive) throw new NotFoundException(`Category not found: ${slug}`);
    return this.dto(category);
  }
  async createCategory(data: CategoryInput): Promise<CategoryDto> {
    if (await this.prisma.db.category.findUnique({ where: { slug: data.slug } })) throw new ConflictException(`Category with slug '${data.slug}' already exists`);
    const kind = data.kind ?? "FRANCHISE";
    try {
      return this.dto(await this.prisma.db.category.create({ data: { ...data, imageUrl: data.imageUrl || defaultCover, imageIsDemo: data.imageUrl ? data.imageIsDemo ?? false : true, kind, family: kind === "PRODUCT_TYPE" ? null : data.family ?? "ANIME" } }));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new ConflictException(`Category with slug '${data.slug}' already exists`);
      throw error;
    }
  }
  async updateCategory(id: string, data: Partial<CategoryInput>): Promise<CategoryDto> {
    const category = await this.prisma.db.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException(`Category not found: ${id}`);
    if (data.slug && data.slug !== category.slug && await this.prisma.db.category.findUnique({ where: { slug: data.slug } })) throw new ConflictException(`Category with slug '${data.slug}' already exists`);
    // Keep established assignments meaningful: a category with products cannot switch dimensions.
    if (data.kind && data.kind !== category.kind) {
      const assigned = await this.prisma.db.product.count({ where: { OR: [{ categoryId: id }, { productTypeId: id }] } });
      if (assigned) throw new ConflictException("Move assigned products before changing between product category and franchise.");
    }
    const kind = data.kind ?? category.kind;
    return this.dto(await this.prisma.db.category.update({ where: { id }, data: { ...data, ...(data.imageUrl === null || data.imageUrl === "" ? { imageUrl: defaultCover, imageIsDemo: true } : {}), family: kind === "PRODUCT_TYPE" ? null : data.family ?? category.family ?? "ANIME" }, include: { _count: counts } }));
  }
  async setCategoryImage(id: string, imageUrl: string, imageIsDemo: boolean) {
    return this.updateCategory(id, { imageUrl, imageIsDemo });
  }
}
