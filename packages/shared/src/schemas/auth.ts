import { z } from "zod";
export const emailSchema = z.string().trim().email().max(254);
export const strongPasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");
export const otpTypeSchema = z.enum(["signup", "recovery"]);
export const otpTokenSchema = z
  .string()
  .trim()
  .regex(/^\d{6,8}$/, "Enter your 6-to-8-digit verification code.");
export const signInSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
    remember: z.boolean().default(false),
    next: z.string().max(512).optional(),
  })
  .strict();
export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    email: emailSchema,
    password: strongPasswordSchema,
    next: z.string().max(512).optional(),
  })
  .strict();
export const verifyOtpSchema = z
  .object({
    email: emailSchema,
    token: otpTokenSchema,
    type: otpTypeSchema,
    next: z.string().max(512).optional(),
  })
  .strict();
export const resendOtpSchema = z
  .object({
    email: emailSchema,
    type: otpTypeSchema,
  })
  .strict();
export const resetSchema = z.object({ email: emailSchema }).strict();
export const passwordSchema = z
  .object({ password: strongPasswordSchema })
  .strict();
export const profileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120).optional(),
    phone: z
      .string()
      .regex(/^(?:\+880|0)1[3-9]\d{8}$/)
      .nullable()
      .optional(),
  })
  .strict();

export const adminEmailChangeSchema = z.object({
  email: emailSchema.transform(value => value.toLowerCase()),
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
}).strict();
