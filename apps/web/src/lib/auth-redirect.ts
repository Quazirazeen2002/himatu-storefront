const INTERNAL_BASE = "https://himatu.internal";

export const PUBLIC_AUTH_PAGES = new Set([
  "/sign-in",
  "/create-account",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/update-password",
]);

const PUBLIC_EXACT_PATHS = new Set([
  ...PUBLIC_AUTH_PAGES,
  "/auth/callback",
  "/favicon.ico",
  "/icon.svg",
  "/robots.txt",
  "/sitemap.xml",
]);

const PUBLIC_PREFIXES = [
  "/api/auth/",
  "/_next/",
  "/images/",
  "/art/",
  "/fonts/",
];

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * Determines whether a request pathname is accessible without customer authentication.
 * All storefront, product, collection, bag, wishlist, checkout, account, 3D-printing,
 * campaign and admin routes return false (protected).
 */
export function isPublicRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (PUBLIC_EXACT_PATHS.has(normalized)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Validates a return path against the application's own origin to prevent open-redirect
 * and protocol/backslash injection vulnerabilities.
 */
export function sanitizeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/",
  options: { allowRecovery?: boolean } = {},
): string {
  if (typeof candidate !== "string") return fallback;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.length > 512) return fallback;
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, INTERNAL_BASE);
    if (
      parsed.origin !== INTERNAL_BASE ||
      !parsed.pathname.startsWith("/") ||
      parsed.pathname.startsWith("//")
    ) {
      return fallback;
    }
    const normalized = normalizePathname(parsed.pathname);
    if (
      options.allowRecovery &&
      (normalized === "/reset-password" || normalized === "/update-password")
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (
      PUBLIC_AUTH_PAGES.has(normalized) ||
      normalized === "/auth/callback" ||
      parsed.pathname.startsWith("/api/auth/")
    ) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Builds the /sign-in redirect target preserving the customer's intended storefront URL.
 */
export function buildSignInRedirect(pathname: string, search = ""): string {
  const normalizedSearch = search
    ? search.startsWith("?")
      ? search
      : `?${search}`
    : "";
  const fullTarget = `${pathname || "/"}${normalizedSearch}`;
  const safeTarget = sanitizeRedirectPath(fullTarget, "/");
  if (safeTarget === "/") return "/sign-in";
  return `/sign-in?next=${encodeURIComponent(safeTarget)}`;
}

