import { NextRequest } from "next/server";
import {
  isPublicRoute,
  sanitizeRedirectPath,
  buildSignInRedirect,
} from "../src/lib/auth-redirect";
import { proxy } from "../src/proxy";

// Mock @supabase/ssr createServerClient for testing proxy behavior
let mockUser: { id: string; email: string; email_confirmed_at: string | null } | null = null;
let mockGetUserError: Error | null = null;

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(async () => {
        if (mockGetUserError) return { data: { user: null }, error: mockGetUserError };
        return { data: { user: mockUser }, error: null };
      }),
    },
  })),
}));

describe("Public Browsing & Purchase Access Control & Route Protection", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      APP_URL: "http://localhost:3000",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "public-anon-key",
      AUTH_ALLOW_LOCAL_ORIGINS: "true",
    };
    mockUser = null;
    mockGetUserError = null;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isPublicRoute classification", () => {
    it("protects checkout and private customer/admin routes", () => {
      for (const path of ["/checkout", "/account", "/account/orders", "/admin", "/admin/products", "/order-confirmation"]) expect(isPublicRoute(path)).toBe(false);
    });
    it("allows browsing without an account", () => {
      for (const path of ["/", "/shop", "/collections/one-piece", "/products/straw-hat-captain", "/bag", "/wishlist", "/3d-printing", "/about"]) expect(isPublicRoute(path)).toBe(true);
    });

    it("allows public access only to auth pages, callbacks, and essential assets", () => {
      const publicRoutes = [
        "/sign-in",
        "/create-account",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/update-password",
        "/auth/callback",
        "/favicon.ico",
        "/icon.svg",
        "/robots.txt",
        "/sitemap.xml",
        "/api/auth/sign-in",
        "/api/auth/register",
        "/api/auth/verify-otp",
        "/_next/static/chunks/app.js",
        "/images/logo.png",
        "/art/photo.jpg",
        "/fonts/barlow.woff2",
      ];

      for (const route of publicRoutes) {
        expect(isPublicRoute(route)).toBe(true);
      }
    });
  });

  describe("sanitizeRedirectPath & open-redirect prevention", () => {
    it("allows valid relative application paths", () => {
      expect(sanitizeRedirectPath("/shop")).toBe("/shop");
      expect(sanitizeRedirectPath("/products/straw-hat-captain?color=red")).toBe(
        "/products/straw-hat-captain?color=red",
      );
      expect(sanitizeRedirectPath("/bag")).toBe("/bag");
      expect(sanitizeRedirectPath("/checkout")).toBe("/checkout");
    });

    it("rejects protocol-relative and external domain redirect attacks", () => {
      expect(sanitizeRedirectPath("//evil.example.com")).toBe("/");
      expect(sanitizeRedirectPath("https://evil.example.com/shop")).toBe("/");
      expect(sanitizeRedirectPath("http://evil.example.com")).toBe("/");
      expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/");
      expect(sanitizeRedirectPath("/\\evil.example.com")).toBe("/");
      expect(sanitizeRedirectPath("///evil.example.com")).toBe("/");
    });

    it("prevents auth loop redirects by falling back to root", () => {
      expect(sanitizeRedirectPath("/sign-in")).toBe("/");
      expect(sanitizeRedirectPath("/create-account")).toBe("/");
      expect(sanitizeRedirectPath("/verify-email")).toBe("/");
      expect(sanitizeRedirectPath("/auth/callback")).toBe("/");
      expect(sanitizeRedirectPath("/api/auth/sign-in")).toBe("/");
    });

    it("permits password reset destinations only when allowRecovery is true", () => {
      expect(sanitizeRedirectPath("/reset-password", "/")).toBe("/");
      expect(sanitizeRedirectPath("/reset-password?step=password", "/", { allowRecovery: true })).toBe(
        "/reset-password?step=password",
      );
    });
  });

  describe("buildSignInRedirect return URLs", () => {
    it("redirects root path directly to /sign-in without next parameter", () => {
      expect(buildSignInRedirect("/")).toBe("/sign-in");
    });

    it("encodes deep product and storefront paths into next parameter", () => {
      expect(buildSignInRedirect("/products/luffy-gear-five")).toBe(
        "/sign-in?next=%2Fproducts%2Fluffy-gear-five",
      );
      expect(buildSignInRedirect("/shop", "category=figures")).toBe(
        "/sign-in?next=%2Fshop%3Fcategory%3Dfigures",
      );
    });

    it("cleanses malicious next targets before building redirect", () => {
      expect(buildSignInRedirect("//attacker.example.com")).toBe("/sign-in");
    });
  });

  describe("Next.js 16 Proxy Execution & Access Enforcement", () => {
    function createRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
      const parsed = new URL(url);
      const headers = new Headers();
      headers.set("host", parsed.host);
      headers.set("origin", parsed.origin);

      const cookieHeader = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
      if (cookieHeader) headers.set("cookie", cookieHeader);

      return new NextRequest(url, { headers });
    }

    it("allows signed-out visitors to browse", async () => {
      for (const path of ["/", "/shop", "/products/straw-hat-captain", "/bag", "/wishlist", "/3d-printing"]) {
        const res = await proxy(createRequest(`http://localhost:3000${path}`));
        expect(res.status).toBe(200);
        expect(res.headers.get("location")).toBeNull();
      }
    });

    it("redirects a signed-out visitor accessing /account to /sign-in", async () => {
      mockUser = null;
      const req = createRequest("http://localhost:3000/account");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/sign-in?next=%2Faccount",
      );
    });

    it("redirects a signed-out visitor accessing /checkout to /sign-in", async () => {
      mockUser = null;
      const req = createRequest("http://localhost:3000/checkout");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/sign-in?next=%2Fcheckout",
      );
    });

    it("redirects an authenticated customer whose email is NOT verified to /verify-email", async () => {
      mockUser = {
        id: "cust-1",
        email: "unverified@example.com",
        email_confirmed_at: null,
      };

      const req = createRequest("http://localhost:3000/checkout");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/verify-email?email=unverified%40example.com",
      );
    });

    it("redirects a user in an active recovery session away from storefront to /reset-password", async () => {
      mockUser = {
        id: "cust-1",
        email: "verified@example.com",
        email_confirmed_at: "2026-11-08T00:00:00Z",
      };

      const req = createRequest("http://localhost:3000/checkout", {
        "himatu-recovery": "1",
      });
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/reset-password?step=password",
      );
    });

    it("allows authenticated verified customer access to protected storefront pages", async () => {
      mockUser = {
        id: "cust-1",
        email: "verified@example.com",
        email_confirmed_at: "2026-11-08T00:00:00Z",
      };

      const req = createRequest("http://localhost:3000/checkout");
      const res = await proxy(req);

      // NextResponse.next() returns status 200 without a redirect location header
      expect(res.headers.get("location")).toBeNull();
    });

    it("allows unauthenticated access to public auth pages and assets", async () => {
      mockUser = null;
      const publicPaths = [
        "http://localhost:3000/sign-in",
        "http://localhost:3000/create-account",
        "http://localhost:3000/verify-email",
        "http://localhost:3000/forgot-password",
        "http://localhost:3000/reset-password",
        "http://localhost:3000/auth/callback",
        "http://localhost:3000/favicon.ico",
      ];

      for (const url of publicPaths) {
        const req = createRequest(url);
        const res = await proxy(req);
        expect(res.headers.get("location")).toBeNull();
      }
    });

    it("redirects an authenticated verified customer visiting /sign-in back to storefront", async () => {
      mockUser = {
        id: "cust-1",
        email: "verified@example.com",
        email_confirmed_at: "2026-11-08T00:00:00Z",
      };

      const req = createRequest("http://localhost:3000/sign-in?next=%2Fproducts%2Fstraw-hat-captain");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/products/straw-hat-captain",
      );
    });
  });
});

