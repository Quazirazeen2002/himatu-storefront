export type AuthRateLimitAction =
  | "sign-in"
  | "register"
  | "reset"
  | "verify-otp"
  | "resend-otp"
  | "update-password"
  | "admin-email";

export const OTP_RESEND_COOLDOWN_SECONDS = 60;

interface WindowPolicy {
  maxAttempts: number;
  windowMs: number;
}

const POLICIES: Record<AuthRateLimitAction, WindowPolicy> = {
  "sign-in": { maxAttempts: 10, windowMs: 60_000 },
  register: { maxAttempts: 5, windowMs: 60_000 },
  reset: { maxAttempts: 5, windowMs: 60_000 },
  "verify-otp": { maxAttempts: 5, windowMs: 60_000 },
  "resend-otp": { maxAttempts: 3, windowMs: 15 * 60_000 },
  "update-password": { maxAttempts: 5, windowMs: 60_000 },
  "admin-email": { maxAttempts: 5, windowMs: 60_000 },
};

const attemptWindows = new Map<string, number[]>();
const otpLastSentAt = new Map<string, number>();

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

function prune(timestamps: number[], cutoff: number): number[] {
  return timestamps.filter((t) => t > cutoff);
}

/**
 * Checks and records an attempt against the sliding-window rate limit for a sensitive auth action.
 */
export function checkAuthRateLimit(
  subjectKey: string,
  action: AuthRateLimitAction,
  now = Date.now(),
): RateLimitDecision {
  const policy = POLICIES[action];
  const key = `${action}:${subjectKey.trim().toLowerCase()}`;
  const cutoff = now - policy.windowMs;
  const active = prune(attemptWindows.get(key) || [], cutoff);

  if (active.length >= policy.maxAttempts) {
    attemptWindows.set(key, active);
    const oldest = active[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + policy.windowMs - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  active.push(now);
  attemptWindows.set(key, active);
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Enforces a per-email cooldown between OTP sends (signup or recovery).
 */
export function checkOtpResendCooldown(
  email: string,
  type: "signup" | "recovery",
  now = Date.now(),
): RateLimitDecision {
  const key = `${type}:${email.trim().toLowerCase()}`;
  const lastSent = otpLastSentAt.get(key);
  const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
  if (lastSent !== undefined && now - lastSent < cooldownMs) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((lastSent + cooldownMs - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Records that an OTP email was dispatched for cooldown tracking.
 */
export function recordOtpSent(
  email: string,
  type: "signup" | "recovery",
  now = Date.now(),
): void {
  const key = `${type}:${email.trim().toLowerCase()}`;
  otpLastSentAt.set(key, now);
}

/**
 * Resets in-memory rate limit and cooldown state (used for isolated automated tests).
 */
export function resetAuthRateLimits(): void {
  attemptWindows.clear();
  otpLastSentAt.clear();
}

