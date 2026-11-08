import {
  checkAuthRateLimit,
  checkOtpResendCooldown,
  recordOtpSent,
  resetAuthRateLimits,
} from "../src/lib/auth-rate-limit";

describe("Rate limiting and OTP cooldown", () => {
  beforeEach(() => {
    resetAuthRateLimits();
  });

  it("permits initial attempts under limits", () => {
    const res = checkAuthRateLimit("test-user@example.com", "sign-in");
    expect(res.allowed).toBe(true);
    expect(res.retryAfterSeconds).toBe(0);
  });

  it("throttles sign-in attempts exceeding maximum threshold", () => {
    const email = "brute-force@example.com";
    for (let i = 0; i < 10; i++) {
      expect(checkAuthRateLimit(email, "sign-in").allowed).toBe(true);
    }
    const blocked = checkAuthRateLimit(email, "sign-in");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("throttles OTP verification attempts to prevent brute-forcing 6-digit codes", () => {
    const email = "otp-target@example.com";
    for (let i = 0; i < 5; i++) {
      expect(checkAuthRateLimit(email, "verify-otp").allowed).toBe(true);
    }
    const blocked = checkAuthRateLimit(email, "verify-otp");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("enforces a 60-second cooldown between OTP sends for the same email", () => {
    const email = "collector@example.com";
    expect(checkOtpResendCooldown(email, "signup").allowed).toBe(true);

    recordOtpSent(email, "signup", 100000);

    // 10 seconds later: should be blocked with 50s retryAfter
    const blocked = checkOtpResendCooldown(email, "signup", 110000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(50);

    // 61 seconds later: should be allowed
    const allowed = checkOtpResendCooldown(email, "signup", 161000);
    expect(allowed.allowed).toBe(true);
    expect(allowed.retryAfterSeconds).toBe(0);
  });
});
