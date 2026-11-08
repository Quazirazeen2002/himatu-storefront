export type AuthActionType =
  | "sign-in"
  | "register"
  | "reset"
  | "verify-otp"
  | "resend-otp"
  | "update-password";

/** Allowlisted provider errors only: never return raw provider text or credentials. */
export function authFailure(
  error: { code?: string; status?: number; message?: string },
  action: AuthActionType,
) {
  const code = error.code;
  const lowerMessage = (error.message || "").toLowerCase();
  if (code === "email_address_not_authorized")
    return {
      status: 503,
      body: {
        ok: false as const,
        code: "email_delivery_unavailable",
        message:
          "Verification and password-reset emails are not available for this address yet. HIMATU needs to finish email sending setup before you can complete registration or recover your password.",
      },
    };
  if (code === "email_not_confirmed")
    return {
      status: 401,
      body: {
        ok: false as const,
        code,
        message:
          "Verify your email before signing in. If no verification email arrived, account setup cannot finish until HIMATU enables email delivery.",
      },
    };
  if (
    action === "register" &&
    (code === "user_already_exists" ||
      code === "email_exists" ||
      lowerMessage.includes("already registered"))
  )
    return {
      status: 409,
      body: {
        ok: false as const,
        code: "account_exists",
        message:
          "An account with this email already exists. Sign in or reset your password.",
      },
    };
  if (
    code === "otp_expired" ||
    (action === "verify-otp" && lowerMessage.includes("expired"))
  )
    return {
      status: 400,
      body: {
        ok: false as const,
        code: "otp_expired",
        message:
          "This verification code is incorrect or has expired. Check your latest email or request a new code.",
      },
    };
  if (
    action === "verify-otp" &&
    (code === "otp_disabled" ||
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403 ||
      code === "validation_failed")
  )
    return {
      status: 400,
      body: {
        ok: false as const,
        code: "otp_invalid",
        message:
          "The verification code is incorrect or has expired. Check your latest email or request a new code.",
      },
    };
  if (code === "user_banned")
    return {
      status: 403,
      body: {
        ok: false as const,
        code: "account_disabled",
        message:
          "This account is currently disabled or unavailable. Please contact HIMATU support.",
      },
    };
  if (code === "same_password")
    return {
      status: 400,
      body: {
        ok: false as const,
        code: "same_password",
        message:
          "Choose a new password that is different from your previous password.",
      },
    };
  if (code === "over_email_send_rate_limit")
    return {
      status: 429,
      body: {
        ok: false as const,
        code: "email_rate_limited",
        message:
          "Account emails have reached the sending limit. New account verification and password recovery cannot complete until email sending is available. Existing verified accounts can still sign in.",
      },
    };
  if (error.status === 429 || code === "over_request_rate_limit")
    return {
      status: 429,
      body: {
        ok: false as const,
        code: "rate_limited",
        message:
          action === "sign-in"
            ? "Too many sign-in requests. Please wait before trying again."
            : "Too many account requests. Please wait before trying again.",
      },
    };
  if (code === "email_address_invalid")
    return {
      status: 400,
      body: {
        ok: false as const,
        code,
        message: "Enter a valid email address that can receive account emails.",
      },
    };
  if (code === "weak_password")
    return {
      status: 400,
      body: {
        ok: false as const,
        code,
        message:
          "Choose a stronger password with at least 8 characters, including a letter and a number.",
      },
    };
  if (code === "signup_disabled")
    return {
      status: 503,
      body: {
        ok: false as const,
        code,
        message: "New account registration is currently unavailable.",
      },
    };
  if (error.status && error.status >= 500)
    return {
      status: 503,
      body: {
        ok: false as const,
        code: "service_unavailable",
        message:
          "Account services are temporarily unavailable. Please try again later.",
      },
    };
  return {
    status: action === "sign-in" ? 401 : 400,
    body: {
      ok: false as const,
      code:
        action === "sign-in"
          ? "invalid_credentials"
          : action === "verify-otp"
            ? "otp_invalid"
            : `${action}_failed`,
      message:
        action === "sign-in"
          ? "The email or password is incorrect. Use an account you have already created and verified. There is no shared demo password."
          : action === "register"
            ? "Registration could not be completed. Check your details and try again."
            : action === "verify-otp"
              ? "The verification code is invalid. Check the 6-digit code and try again."
              : action === "resend-otp"
                ? "A new verification code could not be sent right now. Please try again shortly."
                : action === "update-password"
                  ? "Password could not be updated. Request a new recovery code and try again."
                  : "Password recovery could not be started. Please try again later.",
    },
  };
}
