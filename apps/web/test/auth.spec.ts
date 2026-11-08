import {
  registrationSchema,
  signInSchema,
  verifyOtpSchema,
  resendOtpSchema,
  profileUpdateSchema,
} from "@himatu/shared";
import { accountHref, authService } from "../src/lib/auth-service";

describe("Customer form, OTP and session contracts", () => {
  afterEach(() => jest.restoreAllMocks());

  it("requires valid registration name, email and strong password", () => {
    // Missing required fields
    expect(
      registrationSchema.safeParse({ fullName: "", email: "bad", password: "short" })
        .success,
    ).toBe(false);

    // Weak password without numbers
    expect(
      registrationSchema.safeParse({
        fullName: "Collector",
        email: "collector@example.com",
        password: "NoNumbersPassword",
      }).success,
    ).toBe(false);

    // Valid registration
    expect(
      registrationSchema.safeParse({
        fullName: "Collector",
        email: "collector@example.com",
        password: "ExamplePassword123",
      }).success,
    ).toBe(true);
  });

  it("validates 6-digit numeric OTP schema", () => {
    expect(
      verifyOtpSchema.safeParse({
        email: "collector@example.com",
        token: "12345", // too short
        type: "signup",
      }).success,
    ).toBe(false);

    expect(
      verifyOtpSchema.safeParse({
        email: "collector@example.com",
        token: "12345a", // non-digit
        type: "signup",
      }).success,
    ).toBe(false);

    expect(
      verifyOtpSchema.safeParse({
        email: "collector@example.com",
        token: "123456",
        type: "signup",
      }).success,
    ).toBe(true);

    expect(
      verifyOtpSchema.safeParse({
        email: "collector@example.com",
        token: "654321",
        type: "recovery",
      }).success,
    ).toBe(true);
  });

  it("validates OTP resend payload schema", () => {
    expect(
      resendOtpSchema.safeParse({
        email: "not-an-email",
        type: "signup",
      }).success,
    ).toBe(false);

    expect(
      resendOtpSchema.safeParse({
        email: "collector@example.com",
        type: "signup",
      }).success,
    ).toBe(true);

    expect(
      resendOtpSchema.safeParse({
        email: "collector@example.com",
        type: "recovery",
      }).success,
    ).toBe(true);
  });

  it("requires sign-in credentials and rejects injected role", () => {
    expect(signInSchema.safeParse({ email: "bad", password: "" }).success).toBe(
      false,
    );
    expect(
      signInSchema.safeParse({
        email: "collector@example.com",
        password: "abc",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });

  it("profile schema rejects role and ownership input", () => {
    expect(profileUpdateSchema.safeParse({ role: "ADMIN" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ userId: "other" }).success).toBe(
      false,
    );
  });

  it("routes signed-in and signed-out customers without tokens in UI state", () => {
    expect(accountHref(null)).toBe("/sign-in");
    expect(
      accountHref({
        user: {
          id: "1",
          supabaseUserId: "2",
          email: "collector@example.com",
          fullName: "Collector",
          phone: null,
          role: "CUSTOMER",
          createdAt: "2026-11-08",
        },
      }),
    ).toBe("/account");
  });

  it("uses same-origin CSRF header and returns real service errors", async () => {
    const fetch = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => ({
        ok: false,
        code: "invalid_credentials",
        message: "Sign-in failed",
      }),
    } as Response);

    const result = await authService.signIn({
      email: "collector@example.com",
      password: "ExamplePassword123",
      remember: false,
    });
    expect(result.ok).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-in",
      expect.objectContaining({
        credentials: "same-origin",
        headers: expect.objectContaining({ "X-Himatu-Request": "1" }),
      }),
    );
  });

  it("handles request failure without pretending authentication", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    expect(
      (
        await authService.signIn({
          email: "collector@example.com",
          password: "ExamplePassword123",
          remember: false,
        })
      ).ok,
    ).toBe(false);
  });

  it("invokes OTP verification with required CSRF header and payload", async () => {
    const fetch = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => ({
        ok: true,
        redirectTo: "/",
      }),
    } as Response);

    const result = await authService.verifyOtp({
      email: "collector@example.com",
      token: "123456",
      type: "signup",
    });
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/verify-otp",
      expect.objectContaining({
        credentials: "same-origin",
        headers: expect.objectContaining({ "X-Himatu-Request": "1" }),
        body: JSON.stringify({
          email: "collector@example.com",
          token: "123456",
          type: "signup",
        }),
      }),
    );
  });
});
