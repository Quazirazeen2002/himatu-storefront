export type Role = "CUSTOMER" | "ADMIN" | "MODERATOR";
export type OtpVerificationType = "signup" | "recovery";
export interface CustomerProfile {
  id: string;
  supabaseUserId: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}
export type AuthResponse =
  | {
      ok: true;
      message?: string;
      redirectTo?: string;
      email?: string;
      retryAfterSeconds?: number;
    }
  | {
      ok: false;
      code: string;
      message: string;
      redirectTo?: string;
      email?: string;
      retryAfterSeconds?: number;
    };
