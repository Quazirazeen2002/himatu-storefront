import type {
  AuthResponse,
  CustomerProfile,
  OtpVerificationType,
} from "@himatu/shared";
export interface CustomerSession {
  user: CustomerProfile;
  accessToken?: string;
}
export type AuthResult = AuthResponse;
export interface SignInInput {
  email: string;
  password: string;
  remember: boolean;
  next?: string;
}
export interface RegistrationInput {
  fullName: string;
  email: string;
  password: string;
  next?: string;
}
export interface VerifyOtpInput {
  email: string;
  token: string;
  type: OtpVerificationType;
  next?: string;
}
export interface ResendOtpInput {
  email: string;
  type: OtpVerificationType;
}
async function request(action: string, input: unknown): Promise<AuthResult> {
  try {
    const response = await fetch(`/api/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Himatu-Request": "1" },
      credentials: "same-origin",
      body: JSON.stringify(input),
    });
    const result: AuthResult = await response.json();
    if (
      result.ok &&
      typeof window !== "undefined" &&
      (action === "sign-in" || action === "sign-out" || action === "verify-otp")
    ) {
      window.dispatchEvent(new CustomEvent("himatu:auth-change"));
    }
    return result;
  } catch {
    return {
      ok: false,
      code: "network_error",
      message: "Account services could not be reached. Please try again.",
    };
  }
}
export const authService = {
  async getSession(): Promise<CustomerSession | null> {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.ok ? { user: data.user, accessToken: data.accessToken } : null;
  },
  async getRecoveryStatus(): Promise<{
    readyForPassword: boolean;
    email: string;
  }> {
    try {
      const response = await fetch("/api/auth/recovery-session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) return { readyForPassword: false, email: "" };
      const data = await response.json();
      return {
        readyForPassword: Boolean(data.readyForPassword),
        email: typeof data.email === "string" ? data.email : "",
      };
    } catch {
      return { readyForPassword: false, email: "" };
    }
  },
  signIn: (input: SignInInput) => request("sign-in", input),
  register: (input: RegistrationInput) => request("register", input),
  verifyOtp: (input: VerifyOtpInput) => request("verify-otp", input),
  resendOtp: (input: ResendOtpInput) => request("resend-otp", input),
  requestPasswordReset: (email: string) => request("reset", { email }),
  updatePassword: (password: string) =>
    request("update-password", { password }),
  signOut: () => request("sign-out", {}),
  updateProfile: (input: { fullName?: string; phone?: string | null }) =>
    request("profile", input),
};
export const accountHref = (session: CustomerSession | null) =>
  session ? "/account" : "/sign-in";
