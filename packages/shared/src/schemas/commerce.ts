import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(120),
  slug: z.string().min(1, "Slug is required").max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().max(2048).refine(value => {
    if (value.startsWith("/images/") && !value.includes("\\") && !/[\r\n]/.test(value)) return true;
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  }, "Use a local /images/ path or an HTTPS image URL").optional().nullable(),
  kind: z.enum(["PRODUCT_TYPE", "FRANCHISE"]).default("FRANCHISE"),
  family: z.enum(["ANIME", "MARVEL", "DC", "MOVIES", "OTHER"]).optional().nullable(),
  imageIsDemo: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(220),
  sku: z.string().min(1, "SKU is required").max(100),
  shortDescription: z.string().max(500).optional().nullable(),
  description: z.string().min(1, "Description is required"),
  price: z.number().int().positive("Price must be a positive integer in BDT"),
  salePrice: z.number().int().positive().optional().nullable(),
  currency: z.string().length(3).default("BDT"),
  categoryId: z.string().uuid("Invalid category ID"),
  productTypeId: z.string().uuid("Invalid product category ID").optional().nullable(),
  specifications: z.record(z.string(), z.any()).optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  initialStock: z.number().int().min(0, "Stock cannot be negative").default(0),
});

export const UpdateProductSchema = CreateProductSchema.partial().omit({ initialStock: true });

export const AdjustInventorySchema = z.object({
  quantity: z.number().int().min(0, "Stock cannot be negative"),
  reservedQuantity: z.number().int().min(0).optional(),
});

export const AddCartItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Maximum quantity per item is 50"),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Maximum quantity per item is 50"),
});

export const CreateAddressSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required").max(120),
  phone: z.string().min(6, "Valid phone number required").max(20),
  district: z.string().min(1, "District is required").max(100),
  area: z.string().min(1, "Area / Thana is required").max(150),
  fullAddress: z.string().min(5, "Full address is required").max(500),
  postalCode: z.string().max(20).optional().nullable(),
  label: z.string().max(50).default("HOME"),
  isDefault: z.boolean().default(false),
});

export const UpdateAddressSchema = CreateAddressSchema.partial();

export const CreateOrderSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
  paymentMethod: z.enum(["COD", "BKASH", "NAGAD", "CARD"]).default("COD"),
  customerNotes: z.string().max(1000).optional().nullable(),
});

export const CancelOrderSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required").max(500),
});
