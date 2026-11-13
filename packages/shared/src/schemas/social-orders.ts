import { z } from "zod";
export const SocialChannelSchema = z.enum([
  "whatsapp",
  "instagram",
  "facebook",
  "tiktok",
  "manual",
  "website",
]);
export const SocialCustomerSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().min(6).max(30),
  address: z.string().min(5).max(500),
  area: z.string().min(1).max(150),
  district: z.string().min(1).max(100),
  postalCode: z.string().max(20).default(""),
  orderNotes: z.string().max(1000).default(""),
});
export const SocialItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  slug: z.string().max(220),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(50),
  originalUnitPrice: z.number().int().min(0).max(100000000).optional(),
  unitPrice: z.number().int().min(0).max(100000000),
});
export const SocialRequestSchema = z.object({
  clientReference: z.string().uuid(),
  channel: SocialChannelSchema,
  customer: SocialCustomerSchema,
  items: z.array(SocialItemSchema).min(1).max(50),
});
export const ConfirmSocialOrderSchema = z.object({
  items: z.array(SocialItemSchema).min(1).max(50),
  customer: SocialCustomerSchema,
  shippingCharge: z.number().int().min(0).max(1000000).default(0),
  discountAmount: z.number().int().min(0).max(100000000).default(0),
  paid: z.boolean().default(false),
});
export const HeroSlidesSchema = z.object({
  slides: z
    .array(
      z.object({
        src: z
          .string()
          .refine(
            (s) =>
              (/^\/images\/[a-zA-Z0-9_./-]+$/.test(s) && !s.includes("..")) ||
              /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\//.test(
                s,
              ),
            "Choose a local or uploaded product image",
          ),
        alt: z.string().trim().min(1).max(250),
      }),
    )
    .min(1)
    .max(8),
});
export type SocialRequestInput = z.infer<typeof SocialRequestSchema>;
export type ConfirmSocialOrderInput = z.infer<typeof ConfirmSocialOrderSchema>;
