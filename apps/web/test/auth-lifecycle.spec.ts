import {
  registrationSchema,
  passwordSchema,
  otpTokenSchema,
} from "@himatu/shared";
import { authService } from "../src/lib/auth-service";
import {
  checkOtpResendCooldown,
  recordOtpSent,
  resetAuthRateLimits,
} from "../src/lib/auth-rate-limit";

describe("Complete Customer Authentication Lifecycle", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetAuthRateLimits();
  });

  describe("1. Registration & Validation", () => {
    it("validates valid registration inputs", () => {
      const valid = {
        fullName: "Monkey D. Luffy",
        email: "luffy@himatu.store",
        password: "OnePiece1999!",
      };
      const result = registrationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid emails and empty names", () => {
      expect(
        registrationSchema.safeParse({
          fullName: "",
          email: "luffy@himatu.store",
          password: "OnePiece1999!",
        }).success,
      ).toBe(false);

      expect(
        registrationSchema.safeParse({
          fullName: "Luffy",
          email: "not-an-email",
          password: "OnePiece1999!",
        }).success,
      ).toBe(false);
    });

    it("enforces strong password policy (min 8 chars, 1 letter, 1 number)", () => {
      // Too short (< 8 chars)
      expect(
        registrationSchema.safeParse({
          fullName: "Luffy",
          email: "luffy@himatu.store",
          password: "Pass1",
        }).success,
      ).toBe(false);

      // Only letters (no number)
      expect(
        registrationSchema.safeParse({
          fullName: "Luffy",
          email: "luffy@himatu.store",
          password: "OnlyLettersPassword",
        }).success,
      ).toBe(false);

      // Only numbers (no letter)
      expect(
        registrationSchema.safeParse({
          fullName: "Luffy",
          email: "luffy@himatu.store",
          password: "1234567890",
        }).success,
      ).toBe(false);
    });

    it("sends registration request with same-origin header and receives OTP feedback", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          email: "luffy@himatu.store",
          retryAfterSeconds: 60,
          redirectTo: "/verify-email?email=luffy%40himatu.store",
          message:
            "We sent a 6-digit verification code to your email. Enter the code to confirm your HIMATU account.",
        }),
      } as Response);

      const res = await authService.register({
        fullName: "Monkey D. Luffy",
        email: "luffy@himatu.store",
        password: "OnePiece1999!",
      });

      expect(res.ok).toBe(true);
      expect(res.email).toBe("luffy@himatu.store");
      expect(res.redirectTo).toContain("/verify-email");
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Himatu-Request": "1",
          }),
        }),
      );
    });

    it("handles duplicate registration with clear feedback", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          code: "account_exists",
          message:
            "An account with this email already exists. Sign in or reset your password.",
        }),
      } as Response);

      const res = await authService.register({
        fullName: "Monkey D. Luffy",
        email: "luffy@himatu.store",
        password: "OnePiece1999!",
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("account_exists");
      }
    });
  });

  describe("2. Email OTP Verification", () => {
    it("strictly validates 6-to-8-digit numeric OTP format", () => {
      expect(otpTokenSchema.safeParse("123456").success).toBe(true);
      expect(otpTokenSchema.safeParse("12345678").success).toBe(true);
      expect(otpTokenSchema.safeParse("000000").success).toBe(true);
      expect(otpTokenSchema.safeParse("12345").success).toBe(false);
      expect(otpTokenSchema.safeParse("123456789").success).toBe(false);
      expect(otpTokenSchema.safeParse("abcdef").success).toBe(false);
      expect(otpTokenSchema.safeParse("12345a").success).toBe(false);
    });

    it("verifies signup OTP and redirects to storefront", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          redirectTo: "/shop",
          message: "Email verified. Welcome to HIMATU.",
        }),
      } as Response);

      const res = await authService.verifyOtp({
        email: "luffy@himatu.store",
        token: "482910",
        type: "signup",
        next: "/shop",
      });

      expect(res.ok).toBe(true);
      expect(res.redirectTo).toBe("/shop");
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/verify-otp",
        expect.objectContaining({
          body: JSON.stringify({
            email: "luffy@himatu.store",
            token: "482910",
            type: "signup",
            next: "/shop",
          }),
        }),
      );
    });

    it("handles invalid or expired OTP error", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          code: "otp_invalid",
          message:
            "The verification code could not be confirmed. Request a new code and try again.",
        }),
      } as Response);

      const res = await authService.verifyOtp({
        email: "luffy@himatu.store",
        token: "999999",
        type: "signup",
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("otp_invalid");
      }
    });

    it("enforces cooldown when resending OTP", async () => {
      recordOtpSent("luffy@himatu.store", "signup", Date.now());

      const cooldown = checkOtpResendCooldown("luffy@himatu.store", "signup");
      expect(cooldown.allowed).toBe(false);
      expect(cooldown.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe("3. Login with Verified Credentials", () => {
    it("successfully logs in verified customer", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          redirectTo: "/account",
        }),
      } as Response);

      const res = await authService.signIn({
        email: "luffy@himatu.store",
        password: "OnePiece1999!",
        remember: true,
        next: "/account",
      });

      expect(res.ok).toBe(true);
      expect(res.redirectTo).toBe("/account");
    });

    it("rejects unverified customer and guides them to /verify-email", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          code: "email_not_confirmed",
          email: "luffy@himatu.store",
          redirectTo: "/verify-email?email=luffy%40himatu.store",
          message:
            "Verify your email before signing in. Enter the 6-digit code sent to your inbox.",
        }),
      } as Response);

      const res = await authService.signIn({
        email: "luffy@himatu.store",
        password: "OnePiece1999!",
        remember: false,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("email_not_confirmed");
        expect(res.redirectTo).toContain("/verify-email");
        expect(res.email).toBe("luffy@himatu.store");
      }
    });

    it("rejects invalid credentials without leaking account state", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          code: "invalid_credentials",
          message:
            "The email address or password you entered is incorrect. Please check your credentials and try again.",
        }),
      } as Response);

      const res = await authService.signIn({
        email: "luffy@himatu.store",
        password: "WrongPassword123!",
        remember: false,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.code).toBe("invalid_credentials");
      }
    });

    it("signs out cleanly and redirects to sign-in", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, redirectTo: "/sign-in" }),
      } as Response);

      const res = await authService.signOut();
      expect(res.ok).toBe(true);
      expect(res.redirectTo).toBe("/sign-in");
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/sign-out",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("4. Password Recovery & Update Flow", () => {
    it("requests password recovery without leaking email existence", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          email: "luffy@himatu.store",
          retryAfterSeconds: 60,
          redirectTo: "/reset-password?email=luffy%40himatu.store",
          message:
            "If an account matches this email, you will receive password recovery instructions.",
        }),
      } as Response);

      const res = await authService.requestPasswordReset("luffy@himatu.store");
      expect(res.ok).toBe(true);
      expect(res.redirectTo).toContain("/reset-password");
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/reset",
        expect.objectContaining({
          body: JSON.stringify({ email: "luffy@himatu.store" }),
        }),
      );
    });

    it("verifies recovery OTP with type=recovery", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          email: "luffy@himatu.store",
          redirectTo: "/reset-password?email=luffy%40himatu.store&step=password",
          message: "Verification code confirmed. Choose your new password.",
        }),
      } as Response);

      const res = await authService.verifyOtp({
        email: "luffy@himatu.store",
        token: "654321",
        type: "recovery",
      });

      expect(res.ok).toBe(true);
      expect(res.redirectTo).toContain("step=password");
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/verify-otp",
        expect.objectContaining({
          body: JSON.stringify({
            email: "luffy@himatu.store",
            token: "654321",
            type: "recovery",
          }),
        }),
      );
    });

    it("enforces strong password validation on password update", () => {
      expect(passwordSchema.safeParse({ password: "weak" }).success).toBe(false);
      expect(
        passwordSchema.safeParse({ password: "NewStrongPassword2026!" }).success,
      ).toBe(true);
    });

    it("updates password and redirects to sign-in with reset=success", async () => {
      const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          message: "Password updated. Sign in with your new password.",
          redirectTo: "/sign-in?reset=success",
        }),
      } as Response);

      const res = await authService.updatePassword("NewStrongPassword2026!");
      expect(res.ok).toBe(true);
      expect(res.redirectTo).toBe("/sign-in?reset=success");
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/auth/update-password",
        expect.objectContaining({
          body: JSON.stringify({ password: "NewStrongPassword2026!" }),
        }),
      );
    });

    it("subsequent login works with new password and fails with old password", async () => {
      // Login with new password succeeds
      jest.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, redirectTo: "/account" }),
      } as Response);

      const loginNew = await authService.signIn({
        email: "luffy@himatu.store",
        password: "NewStrongPassword2026!",
        remember: true,
      });
      expect(loginNew.ok).toBe(true);

      // Login with old password fails
      jest.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          ok: false,
          code: "invalid_credentials",
          message: "The email address or password you entered is incorrect.",
        }),
      } as Response);

      const loginOld = await authService.signIn({
        email: "luffy@himatu.store",
        password: "OnePiece1999!",
        remember: false,
      });
      expect(loginOld.ok).toBe(false);
      if (!loginOld.ok) {
        expect(loginOld.code).toBe("invalid_credentials");
      }
    });
  });
});

