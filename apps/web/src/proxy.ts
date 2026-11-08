import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  isPublicRoute,
  buildSignInRedirect,
  sanitizeRedirectPath,
} from "./lib/auth-redirect";
import { allowedAuthOrigin } from "./lib/auth-origin";

function resolveOrigin(request: NextRequest): string {
  const configured = new URL(process.env.APP_URL || "http://localhost:3000")
    .origin;
  const candidate = request.headers.get("origin") || request.nextUrl.origin;
  const trusted = allowedAuthOrigin({
    origin: candidate,
    host: request.headers.get("host"),
    configuredOrigin: configured,
    additionalOrigins: (process.env.AUTH_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    allowLocal: process.env.AUTH_ALLOW_LOCAL_ORIGINS === "true",
  });
  return trusted ? candidate : configured;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/art/") ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/auth/callback" ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const publicRoute = isPublicRoute(pathname);
  const origin = resolveOrigin(request);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    if (publicRoute) return NextResponse.next();
    return NextResponse.redirect(
      new URL(buildSignInRedirect(pathname, search), origin),
    );
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const remember = request.cookies.get("himatu-remember")?.value === "1";
  const supabase = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (changes) => {
          for (const { name, value } of changes) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          for (const { name, value, options } of changes) {
            response.cookies.set(name, value, {
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
          }
        },
      },
      auth: {
        flowType: "pkce",
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(!error && user);
  const isEmailVerified = Boolean(isAuthenticated && user?.email_confirmed_at);
  const isRecoverySession =
    request.cookies.get("himatu-recovery")?.value === "1";

  if (!publicRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        new URL(buildSignInRedirect(pathname, search), origin),
      );
    }
    if (!isEmailVerified) {
      const verifyTarget = user?.email
        ? `/verify-email?email=${encodeURIComponent(user.email)}`
        : "/verify-email";
      return NextResponse.redirect(new URL(verifyTarget, origin));
    }
    if (isRecoverySession) {
      return NextResponse.redirect(
        new URL("/reset-password?step=password", origin),
      );
    }
    return response;
  }

  if (
    isEmailVerified &&
    !isRecoverySession &&
    (pathname === "/sign-in" ||
      pathname === "/create-account" ||
      pathname === "/verify-email")
  ) {
    const destination = sanitizeRedirectPath(
      request.nextUrl.searchParams.get("next"),
      "/",
    );
    return NextResponse.redirect(new URL(destination, origin));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|images/|art/|fonts/|favicon\\.ico|icon\\.svg|robots\\.txt|sitemap\\.xml).*)",
  ],
};

