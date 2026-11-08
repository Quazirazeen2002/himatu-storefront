import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CategoryDto } from "@himatu/shared";

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listPublicCategories(): Promise<CategoryDto[]> {
    const categories = await this.prisma.db.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      isActive: cat.isActive,
      displayOrder: cat.displayOrder,
      productCount: cat._count.products,
    }));
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.db.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category not found: ${slug}`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
      productCount: category._count.products,
    };
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    isActive?: boolean;
    displayOrder?: number;
  }): Promise<CategoryDto> {
    const existing = await this.prisma.db.category.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException(`Category with slug '${data.slug}' already exists`);
    }

    const cat = await this.prisma.db.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
    });

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      isActive: cat.isActive,
      displayOrder: cat.displayOrder,
      productCount: 0,
    };
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      imageUrl?: string | null;
      isActive?: boolean;
      displayOrder?: number;
    },
  ): Promise<CategoryDto> {
    const category = await this.prisma.db.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category not found: ${id}`);
    }

    if (data.slug && data.slug !== category.slug) {
      const existing = await this.prisma.db.category.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new ConflictException(`Category with slug '${data.slug}' already exists`);
      }
    }

    const updated = await this.prisma.db.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      imageUrl: updated.imageUrl,
      isActive: updated.isActive,
      displayOrder: updated.displayOrder,
    };
  }
}

