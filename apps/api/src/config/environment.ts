import { z } from "zod";
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_JWT_ISSUER: z.string().url().optional(),
});
export function validateEnvironment(value: Record<string, unknown>) {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      "Invalid environment configuration: " +
        result.error.issues.map((i) => i.path.join(".")).join(", "),
    );
  const env = result.data;
  if (
    env.NODE_ENV === "production" &&
    (!env.DATABASE_URL ||
      !env.SUPABASE_URL ||
      !env.SUPABASE_PUBLISHABLE_KEY ||
      !env.SUPABASE_JWT_ISSUER)
  )
    throw new Error("Production database/auth configuration is incomplete");
  return { ...value, ...env };
}
