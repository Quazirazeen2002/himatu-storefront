import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductsService } from "../src/products/products.service";
import { StorageService } from "../src/storage/storage.service";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ProductsService & Inventory Core", () => {
  let productsService: ProductsService;
  let storageService: StorageService;

  const mockProduct = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Luffy · Gear Five",
    slug: "luffy-gear-five",
    sku: "HMT-OP-001",
    shortDescription: "Short desc",
    description: "Full description",
    price: 6500,
    salePrice: 5900,
    currency: "BDT",
    categoryId: "22222222-2222-2222-2222-222222222222",
    category: {
      id: "22222222-2222-2222-2222-222222222222",
      name: "One Piece",
      slug: "one-piece",
      description: "One piece figures",
      imageUrl: null,
      isActive: true,
      displayOrder: 1,
    },
    specifications: { Scale: "1/8" },
    isActive: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [
      {
        id: "img-1",
        productId: "11111111-1111-1111-1111-111111111111",
        storagePath: "products/111/img1.webp",
        imageUrl: "https://test.supabase.co/img1.webp",
        altText: "Luffy front",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    inventory: {
      id: "inv-1",
      productId: "11111111-1111-1111-1111-111111111111",
      quantity: 10,
      reservedQuantity: 2,
      updatedAt: new Date(),
    },
  };

  const mockPrisma = {
    db: {
      product: {
        findMany: jest.fn().mockResolvedValue([mockProduct]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.slug === "luffy-gear-five" || where.id === mockProduct.id) {
            return Promise.resolve(mockProduct);
          }
          return Promise.resolve(null);
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(mockProduct),
        create: jest.fn().mockResolvedValue(mockProduct),
        update: jest.fn().mockImplementation(({ where, data }) => {
          return Promise.resolve({
            ...mockProduct,
            ...data,
          });
        }),
      },
      category: {
        findUnique: jest.fn().mockResolvedValue(mockProduct.category),
        findMany: jest.fn().mockResolvedValue([mockProduct.category]),
      },
      inventory: {
        findUnique: jest.fn().mockResolvedValue(mockProduct.inventory),
        create: jest.fn().mockResolvedValue(mockProduct.inventory),
        update: jest.fn().mockImplementation(({ data }) => ({
          ...mockProduct.inventory,
          ...data,
        })),
      },
      productImage: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callbackOrArray) => {
        if (typeof callbackOrArray === "function") {
          return callbackOrArray(mockPrisma.db);
        }
        return Promise.all(callbackOrArray);
      }),
    },
  };

  const mockStorage = {
    uploadProductImage: jest.fn().mockResolvedValue({
      storagePath: "products/111/new.png",
      publicUrl: "https://test.supabase.co/new.png",
    }),
    deleteProductImage: jest.fn().mockResolvedValue(undefined),
    validateFileSignature: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === "SUPABASE_URL") return "https://mock.supabase.co";
              return "mock-key";
            }),
          },
        },
      ],
    }).compile();

    productsService = module.get<ProductsService>(ProductsService);
    storageService = module.get<StorageService>(StorageService);
  });

  describe("Product Retrieval & Filtering", () => {
    it("should list active public products with pagination and inventory stock", async () => {
      const result = await productsService.listPublicProducts({
        page: 1,
        limit: 10,
        sort: "price_asc",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe("Luffy · Gear Five");
      expect(result.items[0].inventory?.availableQuantity).toBe(8); // 10 - 2
      expect(result.total).toBe(1);
      expect(mockPrisma.db.product.findMany).toHaveBeenCalled();
    });

    it("should retrieve a single product by slug with category and primary image", async () => {
      const product = await productsService.getProductBySlug("luffy-gear-five");
      expect(product.slug).toBe("luffy-gear-five");
      expect(product.images[0].isPrimary).toBe(true);
      expect(product.category?.name).toBe("One Piece");
    });

    it("should throw NotFoundException for non-existent product slug", async () => {
      await expect(
        productsService.getProductBySlug("non-existent-figure"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Inventory Adjustments & Safety", () => {
    it("should reject negative stock quantity with BadRequestException", async () => {
      await expect(
        productsService.adjustInventory(mockProduct.id, -5),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject reserved quantity greater than total quantity", async () => {
      await expect(
        productsService.adjustInventory(mockProduct.id, 5, 10),
      ).rejects.toThrow(BadRequestException);
    });

    it("should successfully adjust inventory and return calculated available quantity", async () => {
      const result = await productsService.adjustInventory(mockProduct.id, 20, 5);
      expect(result.quantity).toBe(20);
      expect(result.reservedQuantity).toBe(5);
      expect(result.availableQuantity).toBe(15);
    });
  });

  describe("Product Archiving", () => {
    it("should soft archive product by setting isActive to false", async () => {
      const archived = await productsService.archiveProduct(mockProduct.id);
      expect(mockPrisma.db.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockProduct.id },
          data: { isActive: false },
        }),
      );
    });
  });

  describe("Storage File Signature Validation", () => {
    it("should accept valid PNG magic numbers", () => {
      const actualStorageService = new StorageService({
        get: jest.fn((k) => (k === "SUPABASE_URL" ? "https://mock.supabase.co" : "mock-key")),
      } as any);

      const validPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      expect(
        actualStorageService.validateFileSignature(validPng, "image/png"),
      ).toBe(true);
    });

    it("should accept valid JPEG magic numbers", () => {
      const actualStorageService = new StorageService({
        get: jest.fn((k) => (k === "SUPABASE_URL" ? "https://mock.supabase.co" : "mock-key")),
      } as any);

      const validJpg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);
      expect(
        actualStorageService.validateFileSignature(validJpg, "image/jpeg"),
      ).toBe(true);
    });

    it("should reject forged or corrupt image buffers", () => {
      const actualStorageService = new StorageService({
        get: jest.fn((k) => (k === "SUPABASE_URL" ? "https://mock.supabase.co" : "mock-key")),
      } as any);

      const fakeImage = Buffer.from("<script>alert('xss')</script>");
      expect(
        actualStorageService.validateFileSignature(fakeImage, "image/png"),
      ).toBe(false);
      expect(
        actualStorageService.validateFileSignature(fakeImage, "image/jpeg"),
      ).toBe(false);
    });
  });
});
