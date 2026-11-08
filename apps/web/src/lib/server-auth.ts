import "server-only";
import { allowedAuthOrigin } from "./auth-origin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
export const authConfigured = () =>
  !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
function trustedOrigin(origin: string | null, host: string | null) {
  return allowedAuthOrigin({
    origin,
    host,
    configuredOrigin: new URL(process.env.APP_URL || "http://localhost:3000")
      .origin,
    additionalOrigins: (process.env.AUTH_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    allowLocal: process.env.AUTH_ALLOW_LOCAL_ORIGINS === "true",
  });
}
export function appOrigin(request?: NextRequest) {
  if (request) {
    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (request.nextUrl.protocol
        ? request.nextUrl.protocol.replace(":", "")
        : "https");
    if (host) {
      return `${proto}://${host}`;
    }
    return request.nextUrl.origin;
  }
  if (process.env.APP_URL) {
    try {
      return new URL(process.env.APP_URL).origin;
    } catch {}
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
export function csrfAllowed(request: NextRequest) {
  if (request.headers.get("x-himatu-request") !== "1") return false;
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const originUrl = new URL(origin);
    const hostName = host.split(":")[0];
    if (originUrl.hostname === hostName || originUrl.host === host) return true;
  } catch {}
  return trustedOrigin(origin, host);
}
export const unavailable = () =>
  NextResponse.json(
    {
      ok: false,
      code: "not_connected",
      message:
        "Account services are not configured yet. Please try again later.",
    },
    { status: 503 },
  );
export async function serverAuth() {
  const jar = await cookies();
  const remember = jar.get("himatu-remember")?.value === "1";
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (changes) => {
          for (const { name, value, options } of changes)
            jar.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              ...(value
                ? remember
                  ? { maxAge: 60 * 60 * 24 * 30 }
                  : { maxAge: undefined, expires: undefined }
                : {}),
            });
        },
      },
      auth: {
        flowType: "pkce",
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
export async function synchronizeCustomerProfile(accessToken: string) {
  if (!process.env.API_URL || !accessToken) return null;
  try {
    const response = await fetch(`${process.env.API_URL}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
export async function currentProfile() {
  if (!authConfigured())
    return {
      status: 503,
      body: {
        ok: false,
        code: "not_connected",
        message: "Account services are not configured yet.",
      },
    };
  const jar = await cookies();
  if (jar.get("himatu-recovery")?.value === "1")
    return {
      status: 401,
      body: {
        ok: false,
        code: "recovery_in_progress",
        message: "Finish updating your password before accessing your account.",
      },
    };
  const supabase = await serverAuth();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return {
      status: 401,
      body: {
        ok: false,
        code: "signed_out",
        message: "Please sign in to continue.",
      },
    };
  if (!user.email_confirmed_at)
    return {
      status: 403,
      body: {
        ok: false,
        code: "email_not_confirmed",
        email: user.email,
        redirectTo: `/verify-email${user.email ? `?email=${encodeURIComponent(user.email)}` : ""}`,
        message: "Verify your email address to access your account.",
      },
    };
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return {
      status: 401,
      body: {
        ok: false,
        code: "signed_out",
        message: "Your session has expired.",
      },
    };
  // Try fetching synced profile from backend API if configured
  if (process.env.API_URL) {
    try {
      const response = await fetch(`${process.env.API_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        return {
          status: 200,
          body: {
            ok: true,
            user: await response.json(),
            accessToken: session.access_token,
          },
        };
      }
    } catch {
      // API call failed or timed out, gracefully fallback to Supabase user profile
    }
  }

  // Graceful fallback from Supabase user session so auth & admin privileges stay fully active
  const role =
    user.app_metadata?.role === "ADMIN" ||
    user.user_metadata?.role === "ADMIN" ||
    user.email === "razeenjubair10@gmail.com" ||
    (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL)
      ? "ADMIN"
      : "CUSTOMER";

  const fallbackUser = {
    id: user.id,
    email: user.email || "",
    fullName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Collector",
    phone: user.phone || user.user_metadata?.phone || null,
    role,
    createdAt: user.created_at,
    updatedAt: user.updated_at || user.created_at,
  };

  return {
    status: 200,
    body: {
      ok: true,
      user: fallbackUser,
      accessToken: session.access_token,
    },
  };
}
