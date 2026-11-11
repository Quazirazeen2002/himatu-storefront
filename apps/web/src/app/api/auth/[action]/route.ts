import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authFailure } from "@/lib/auth-errors";
import {
  checkAuthRateLimit,
  checkOtpResendCooldown,
  recordOtpSent,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth-rate-limit";
import { sanitizeRedirectPath } from "@/lib/auth-redirect";
import {
  registrationSchema,
  signInSchema,
  verifyOtpSchema,
  resendOtpSchema,
  resetSchema,
  passwordSchema,
  profileUpdateSchema,
  adminEmailChangeSchema,
} from "@himatu/shared";
import {
  authConfigured,
  serverAuth,
  csrfAllowed,
  unavailable,
  appOrigin,
  currentProfile,
  synchronizeCustomerProfile,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", Vary: "Cookie" },
  });

function clientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
  return request.headers.get("x-real-ip") || "local";
}

function isProviderLevelResetError(error: {
  code?: string;
  status?: number;
}): boolean {
  return Boolean(
    error.code === "email_address_not_authorized" ||
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit" ||
    error.code === "email_address_invalid" ||
    error.status === 429 ||
    (error.status && error.status >= 500),
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  if (action === "recovery-session") {
    if (!authConfigured())
      return json({ ok: false, code: "not_connected" }, 200);
    try {
      const jar = await cookies();
      const pendingEmail = jar.get("himatu-pending-email")?.value || "";
      const hasRecoveryFlag = jar.get("himatu-recovery")?.value === "1";
      const supabase = await serverAuth();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!error && user && hasRecoveryFlag) {
        return json({
          ok: true,
          readyForPassword: true,
          email: user.email || pendingEmail,
        });
      }
      return json({
        ok: true,
        readyForPassword: false,
        email: pendingEmail,
      });
    } catch {
      return json({ ok: false, readyForPassword: false }, 200);
    }
  }
  if (action !== "session")
    return json({ ok: false, message: "Not found" }, 404);
  try {
    const result = await currentProfile();
    return json(
      result.body,
      result.status === 401 || result.status === 403 ? 200 : result.status,
    );
  } catch {
    return json(
      {
        ok: false,
        code: "service_unavailable",
        message: "Account services are temporarily unavailable.",
      },
      503,
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  if (!csrfAllowed(request))
    return json(
      {
        ok: false,
        code: "forbidden_origin",
        message: "Request origin was not accepted.",
      },
      403,
    );
  if (Number(request.headers.get("content-length") || 0) > 16384)
    return json(
      { ok: false, code: "payload_too_large", message: "Request too large" },
      413,
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json(
      { ok: false, code: "invalid_content_type", message: "JSON is required" },
      415,
    );
  const { action } = await params;
  if (!authConfigured()) return unavailable();
  const clientIp = clientIdentifier(request);

  try {
    const input = await request.json(),
      supabase = await serverAuth(),
      jar = await cookies();

    if (action === "sign-in") {
      const value = signInSchema.parse(input);
      const limit = checkAuthRateLimit(`${clientIp}:${value.email}`, "sign-in");
      if (!limit.allowed)
        return json(
          {
            ok: false,
            code: "rate_limited",
            retryAfterSeconds: limit.retryAfterSeconds,
            message:
              "Too many sign-in attempts. Please wait before trying again.",
          },
          429,
        );
      jar.set("himatu-remember", value.remember ? "1" : "0", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        ...(value.remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
      });
      // Recreate after preference is written so authentication cookies use the chosen lifetime.
      const client = await serverAuth();
      const { data, error } = await client.auth.signInWithPassword({
        email: value.email,
        password: value.password,
      });
      if (error) {
        const failure = authFailure(error, "sign-in");
        if (failure.body.code === "email_not_confirmed") {
          const safeNext = sanitizeRedirectPath(value.next, "/");
          const verifyHref = `/verify-email?email=${encodeURIComponent(value.email)}${safeNext !== "/" ? `&next=${encodeURIComponent(safeNext)}` : ""}`;
          return json(
            {
              ...failure.body,
              email: value.email,
              redirectTo: verifyHref,
            },
            failure.status,
          );
        }
        return json(failure.body, failure.status);
      }
      if (!data.session || !data.user)
        return json(
          {
            ok: false,
            code: "session_missing",
            message: "Sign-in did not create a session.",
          },
          401,
        );
      if (!data.user.email_confirmed_at) {
        await client.auth.signOut({ scope: "local" });
        const safeNext = sanitizeRedirectPath(value.next, "/");
        return json(
          {
            ok: false,
            code: "email_not_confirmed",
            email: value.email,
            redirectTo: `/verify-email?email=${encodeURIComponent(value.email)}${safeNext !== "/" ? `&next=${encodeURIComponent(safeNext)}` : ""}`,
            message:
              "Verify your email before signing in. Enter the verification code sent to your inbox.",
          },
          401,
        );
      }
      jar.delete("himatu-recovery");
      jar.delete("himatu-pending-email");
      const signedInProfile = await synchronizeCustomerProfile(
        data.session.access_token,
      );
      let destination = sanitizeRedirectPath(value.next, "/");
      if (!value.next || value.next === "/") {
        const isAdmin = ["ADMIN", "MODERATOR"].includes(signedInProfile?.role);
        if (isAdmin) {
          destination =
            signedInProfile?.role === "MODERATOR"
              ? "/admin/social-orders"
              : "/admin";
        }
      }
      return json({ ok: true, redirectTo: destination });
    }

    if (action === "register") {
      const value = registrationSchema.parse(input);
      const limit = checkAuthRateLimit(
        `${clientIp}:${value.email}`,
        "register",
      );
      if (!limit.allowed)
        return json(
          {
            ok: false,
            code: "rate_limited",
            retryAfterSeconds: limit.retryAfterSeconds,
            message:
              "Too many registration requests. Please wait before trying again.",
          },
          429,
        );
      const cooldown = checkOtpResendCooldown(value.email, "signup");
      if (!cooldown.allowed)
        return json(
          {
            ok: false,
            code: "resend_cooldown",
            retryAfterSeconds: cooldown.retryAfterSeconds,
            message: `Please wait ${cooldown.retryAfterSeconds} seconds before requesting another verification code.`,
          },
          429,
        );
      const { data, error } = await supabase.auth.signUp({
        email: value.email,
        password: value.password,
        options: {
          data: { full_name: value.fullName },
          emailRedirectTo: `${appOrigin(request)}/auth/callback`,
        },
      });
      if (error) {
        const failure = authFailure(error, "register");
        return json(failure.body, failure.status);
      }
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        return json(
          {
            ok: false,
            code: "account_exists",
            message:
              "An account with this email already exists. Sign in or reset your password.",
          },
          409,
        );
      }
      if (data.session && !data.user?.email_confirmed_at) {
        await supabase.auth.signOut({ scope: "local" });
      }
      recordOtpSent(value.email, "signup");
      jar.set("himatu-pending-email", value.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });
      const safeNext = sanitizeRedirectPath(value.next, "/");
      const verifyRedirect = `/verify-email?email=${encodeURIComponent(value.email)}${safeNext !== "/" ? `&next=${encodeURIComponent(safeNext)}` : ""}`;
      return json({
        ok: true,
        email: value.email,
        retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
        redirectTo: verifyRedirect,
        message:
          "We sent a verification code to your email. Enter the code to confirm your HIMATU account.",
      });
    }

    if (action === "verify-otp") {
      const value = verifyOtpSchema.parse(input);
      const limit = checkAuthRateLimit(
        `${clientIp}:${value.email}`,
        "verify-otp",
      );
      if (!limit.allowed)
        return json(
          {
            ok: false,
            code: "rate_limited",
            retryAfterSeconds: limit.retryAfterSeconds,
            message:
              "Too many verification attempts. Please wait a minute before trying again.",
          },
          429,
        );
      let { data, error } = await supabase.auth.verifyOtp({
        email: value.email,
        token: value.token,
        type: value.type,
      });
      if (error && value.type === "signup") {
        const fallback = await supabase.auth.verifyOtp({
          email: value.email,
          token: value.token,
          type: "email",
        });
        if (!fallback.error && fallback.data.session) {
          data = fallback.data;
          error = null;
        }
      }
      if (error) {
        const failure = authFailure(error, "verify-otp");
        return json(failure.body, failure.status);
      }
      if (!data.session || !data.user) {
        return json(
          {
            ok: false,
            code: "otp_invalid",
            message:
              "The verification code could not be confirmed. Request a new code and try again.",
          },
          400,
        );
      }
      if (value.type === "signup") {
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut({ scope: "local" });
          return json(
            {
              ok: false,
              code: "email_not_confirmed",
              message: "Email verification is still pending.",
            },
            400,
          );
        }
        jar.delete("himatu-pending-email");
        jar.delete("himatu-recovery");
        await synchronizeCustomerProfile(data.session.access_token);
        const destination = sanitizeRedirectPath(value.next, "/");
        return json({
          ok: true,
          redirectTo: destination,
          message: "Email verified. Welcome to HIMATU.",
        });
      }
      // value.type === "recovery"
      jar.set("himatu-recovery", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      });
      jar.set("himatu-pending-email", value.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      });
      return json({
        ok: true,
        email: value.email,
        redirectTo: `/reset-password?email=${encodeURIComponent(value.email)}&step=password`,
        message: "Verification code confirmed. Choose your new password.",
      });
    }

    if (action === "resend-otp") {
      const value = resendOtpSchema.parse(input);
      const cooldown = checkOtpResendCooldown(value.email, value.type);
      if (!cooldown.allowed)
        return json(
          {
            ok: false,
            code: "resend_cooldown",
            retryAfterSeconds: cooldown.retryAfterSeconds,
            message: `Please wait ${cooldown.retryAfterSeconds} seconds before requesting another code.`,
          },
          429,
        );
      const limit = checkAuthRateLimit(
        `${clientIp}:${value.email}`,
        "resend-otp",
      );
      if (!limit.allowed)
        return json(
          {
            ok: false,
            code: "rate_limited",
            retryAfterSeconds: limit.retryAfterSeconds,
            message:
              "Too many verification code requests. Please wait before trying again.",
          },
          429,
        );
      if (value.type === "signup") {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: value.email,
          options: {
            emailRedirectTo: `${appOrigin(request)}/auth/callback`,
          },
        });
        if (error) {
          const failure = authFailure(error, "resend-otp");
          return json(failure.body, failure.status);
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          value.email,
          {
            redirectTo: `${appOrigin(request)}/auth/callback?next=/reset-password`,
          },
        );
        if (error && isProviderLevelResetError(error)) {
          const failure = authFailure(error, "resend-otp");
          return json(failure.body, failure.status);
        }
      }
      recordOtpSent(value.email, value.type);
      return json({
        ok: true,
        email: value.email,
        retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
        message:
          value.type === "signup"
            ? "A new verification code has been sent to your email."
            : "If an account matches this email, a new recovery code has been sent.",
      });
    }

    if (action === "reset") {
      const value = resetSchema.parse(input);
      const cooldown = checkOtpResendCooldown(value.email, "recovery");
      if (!cooldown.allowed)
        return json(
          {
            ok: false,
            code: "resend_cooldown",
            retryAfterSeconds: cooldown.retryAfterSeconds,
            message: `Please wait ${cooldown.retryAfterSeconds} seconds before requesting another recovery code.`,
          },
          429,
        );
      const limit = checkAuthRateLimit(`${clientIp}:${value.email}`, "reset");
      if (!limit.allowed)
        return json(
          {
            ok: false,
            code: "rate_limited",
            retryAfterSeconds: limit.retryAfterSeconds,
            message:
              "Too many password recovery requests. Please wait before trying again.",
          },
          429,
        );
      const { error } = await supabase.auth.resetPasswordForEmail(value.email, {
        redirectTo: `${appOrigin(request)}/auth/callback?next=/reset-password`,
      });
      if (error && isProviderLevelResetError(error)) {
        const failure = authFailure(error, "reset");
        return json(failure.body, failure.status);
      }
      recordOtpSent(value.email, "recovery");
      jar.set("himatu-pending-email", value.email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 30,
      });
      return json({
        ok: true,
        email: value.email,
        retryAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
        redirectTo: `/reset-password?email=${encodeURIComponent(value.email)}`,
        message:
          "If an account matches this email, you will receive password recovery instructions.",
      });
    }

    if (action === "update-password") {
      const value = passwordSchema.parse(input);
      const limit = checkAuthRateLimit(clientIp, "update-password");
      if (!limit.allowed)
        return json(
          {
            ok: false,
            code: "rate_limited",
            retryAfterSeconds: limit.retryAfterSeconds,
            message:
              "Too many password update attempts. Please wait before trying again.",
          },
          429,
        );
      const {
        data: { user },
        error: identityError,
      } = await supabase.auth.getUser();
      if (identityError || !user) {
        jar.delete("himatu-recovery");
        return json(
          {
            ok: false,
            code: "recovery_session_expired",
            message:
              "Your password recovery session has expired. Verify a new 6-digit recovery code to continue.",
          },
          401,
        );
      }
      const { error } = await supabase.auth.updateUser({
        password: value.password,
      });
      if (error) {
        const failure = authFailure(error, "update-password");
        return json(failure.body, failure.status);
      }
      jar.delete("himatu-recovery");
      jar.delete("himatu-pending-email");
      await supabase.auth.signOut({ scope: "local" });
      return json({
        ok: true,
        message: "Password updated. Sign in with your new password.",
        redirectTo: "/sign-in?reset=success",
      });
    }

    if (action === "sign-out") {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error)
        return json(
          {
            ok: false,
            code: "sign_out_failed",
            message: "Sign-out could not be confirmed. Please try again.",
          },
          503,
        );
      jar.delete("himatu-remember");
      jar.delete("himatu-recovery");
      jar.delete("himatu-pending-email");
      return json({ ok: true, redirectTo: "/sign-in" });
    }

    if (action === "admin-email") {
      const value = adminEmailChangeSchema.parse(input);
      const profile = await currentProfile();
      if (
        profile.status !== 200 ||
        !profile.body.ok ||
        profile.body.user?.role !== "ADMIN"
      )
        return json(
          {
            ok: false,
            code: "forbidden",
            message: "Administrator access is required.",
          },
          403,
        );
      const identity = await supabase.auth.getUser();
      const user = identity.data.user;
      if (identity.error || !user?.email || !user.email_confirmed_at)
        return json(
          { ok: false, code: "signed_out", message: "Please sign in again." },
          401,
        );
      const limit = checkAuthRateLimit(`${clientIp}:${user.id}`, "admin-email");
      if (!limit.allowed)
        return json(
          {
            ok: false,
            code: "rate_limited",
            message:
              "Too many email change attempts. Please wait before trying again.",
            retryAfterSeconds: limit.retryAfterSeconds,
          },
          429,
        );
      if (user.email.toLowerCase() === value.email)
        return json(
          {
            ok: false,
            code: "same_email",
            message: "Enter a different email address.",
          },
          400,
        );
      const verified = await supabase.auth.signInWithPassword({
        email: user.email,
        password: value.currentPassword,
      });
      if (verified.error || verified.data.user?.id !== user.id)
        return json(
          {
            ok: false,
            code: "reauthentication_failed",
            message: "Your current password could not be verified.",
          },
          401,
        );
      const redirect = new URL(
        "/auth/callback?next=%2Fadmin%2Fsettings",
        process.env.APP_URL || "http://localhost:3000",
      ).toString();
      const result = await supabase.auth.updateUser(
        { email: value.email },
        { emailRedirectTo: redirect },
      );
      if (result.error)
        return json(
          {
            ok: false,
            code: "email_change_failed",
            message:
              "The email change could not be requested. Please check the address or try again later.",
          },
          result.error.status === 429 ? 429 : 400,
        );
      return json({
        ok: true,
        message:
          "Follow the verification instructions sent by email to complete your address change. Your staff permissions will remain unchanged.",
      });
    }

    if (action === "profile") {
      const value = profileUpdateSchema.parse(input);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user || !user.email_confirmed_at)
        return json(
          { ok: false, code: "signed_out", message: "Please sign in." },
          401,
        );
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !process.env.API_URL)
        return json(
          {
            ok: false,
            code: "service_unavailable",
            message: "Profile service is unavailable.",
          },
          503,
        );
      const response = await fetch(`${process.env.API_URL}/api/v1/users/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        return json(
          {
            ok: false,
            code:
              response.status === 401 ? "signed_out" : "profile_update_failed",
            message: "Profile could not be updated.",
          },
          response.status === 401 ? 401 : 400,
        );
      return json({ ok: true, user: await response.json() });
    }

    if (action === "set-session") {
      const accessToken =
        typeof input?.access_token === "string" ? input.access_token : "";
      const refreshToken =
        typeof input?.refresh_token === "string" ? input.refresh_token : "";
      const flowType = typeof input?.type === "string" ? input.type : "";
      const nextParam = typeof input?.next === "string" ? input.next : "/";

      if (!accessToken || !refreshToken) {
        return json(
          {
            ok: false,
            code: "invalid_session",
            message: "Invalid session tokens.",
          },
          400,
        );
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error || !data.session || !data.user) {
        return json(
          {
            ok: false,
            code: "session_failed",
            message: "Could not establish session.",
          },
          400,
        );
      }

      const isRecovery =
        flowType === "recovery" ||
        nextParam.startsWith("/reset-password") ||
        nextParam.startsWith("/update-password");

      if (isRecovery) {
        jar.set("himatu-recovery", "1", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 15,
        });
        if (data.user.email) {
          jar.set("himatu-pending-email", data.user.email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 15,
          });
        }
        return json({
          ok: true,
          redirectTo: "/reset-password?step=password",
        });
      }

      jar.delete("himatu-pending-email");
      jar.delete("himatu-recovery");
      await synchronizeCustomerProfile(data.session.access_token);
      const destination = sanitizeRedirectPath(nextParam, "/");
      return json({ ok: true, redirectTo: destination });
    }

    return json({ ok: false, code: "not_found", message: "Not found" }, 404);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error)
      return json(
        {
          ok: false,
          code: "validation_error",
          message: "Check the supplied fields.",
        },
        400,
      );
    return json(
      {
        ok: false,
        code: "service_unavailable",
        message: "Account services are temporarily unavailable.",
      },
      503,
    );
  }
}
