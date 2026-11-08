import {
  isPublicRoute,
  sanitizeRedirectPath,
  buildSignInRedirect,
} from "../src/lib/auth-redirect";

describe("Route protection and redirect contracts", () => {
  describe("isPublicRoute", () => {
    it("allows public authentication routes", () => {
      expect(isPublicRoute("/sign-in")).toBe(true);
      expect(isPublicRoute("/create-account")).toBe(true);
      expect(isPublicRoute("/verify-email")).toBe(true);
      expect(isPublicRoute("/forgot-password")).toBe(true);
      expect(isPublicRoute("/reset-password")).toBe(true);
      expect(isPublicRoute("/update-password")).toBe(true);
      expect(isPublicRoute("/auth/callback")).toBe(true);
    });

    it("allows static assets and auth API", () => {
      expect(isPublicRoute("/api/auth/sign-in")).toBe(true);
      expect(isPublicRoute("/api/auth/register")).toBe(true);
      expect(isPublicRoute("/_next/static/chunks/main.js")).toBe(true);
      expect(isPublicRoute("/images/figures/sample.jpg")).toBe(true);
      expect(isPublicRoute("/fonts/inter.woff2")).toBe(true);
      expect(isPublicRoute("/favicon.ico")).toBe(true);
      expect(isPublicRoute("/icon.svg")).toBe(true);
      expect(isPublicRoute("/robots.txt")).toBe(true);
      expect(isPublicRoute("/sitemap.xml")).toBe(true);
    });

    it("protects homepage and storefront shopping experience", () => {
      expect(isPublicRoute("/")).toBe(false);
      expect(isPublicRoute("/home")).toBe(false);
      expect(isPublicRoute("/shop")).toBe(false);
      expect(isPublicRoute("/collections")).toBe(false);
      expect(isPublicRoute("/collections/one-piece")).toBe(false);
      expect(isPublicRoute("/products/straw-hat-captain")).toBe(false);
      expect(isPublicRoute("/bag")).toBe(false);
      expect(isPublicRoute("/wishlist")).toBe(false);
      expect(isPublicRoute("/checkout")).toBe(false);
      expect(isPublicRoute("/order-confirmation")).toBe(false);
      expect(isPublicRoute("/account")).toBe(false);
      expect(isPublicRoute("/account/orders")).toBe(false);
      expect(isPublicRoute("/campaign")).toBe(false);
      expect(isPublicRoute("/3d-printing")).toBe(false);
      expect(isPublicRoute("/about")).toBe(false);
      expect(isPublicRoute("/contact")).toBe(false);
      expect(isPublicRoute("/admin")).toBe(false);
    });
  });

  describe("sanitizeRedirectPath", () => {
    it("accepts valid relative internal paths", () => {
      expect(sanitizeRedirectPath("/shop")).toBe("/shop");
      expect(sanitizeRedirectPath("/products/luffy-gear-five")).toBe("/products/luffy-gear-five");
      expect(sanitizeRedirectPath("/collections/one-piece?sort=new")).toBe("/collections/one-piece?sort=new");
    });

    it("rejects open-redirect attack vectors and falls back safely", () => {
      expect(sanitizeRedirectPath("https://evil.com/phish")).toBe("/");
      expect(sanitizeRedirectPath("//evil.com/phish")).toBe("/");
      expect(sanitizeRedirectPath("/\\evil.com")).toBe("/");
      expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/");
      expect(sanitizeRedirectPath("   ")).toBe("/");
      expect(sanitizeRedirectPath(null)).toBe("/");
      expect(sanitizeRedirectPath(undefined)).toBe("/");
    });

    it("prevents redirecting back to authentication pages to avoid redirect loops", () => {
      expect(sanitizeRedirectPath("/sign-in")).toBe("/");
      expect(sanitizeRedirectPath("/create-account")).toBe("/");
      expect(sanitizeRedirectPath("/verify-email")).toBe("/");
      expect(sanitizeRedirectPath("/forgot-password")).toBe("/");
      expect(sanitizeRedirectPath("/api/auth/sign-in")).toBe("/");
    });
  });

  describe("buildSignInRedirect", () => {
    it("builds clean redirect for root", () => {
      expect(buildSignInRedirect("/")).toBe("/sign-in");
    });

    it("preserves destination query parameters safely", () => {
      expect(buildSignInRedirect("/products/luffy-gear-five")).toBe(
        "/sign-in?next=%2Fproducts%2Fluffy-gear-five",
      );
      expect(buildSignInRedirect("/shop", "sort=price-asc")).toBe(
        "/sign-in?next=%2Fshop%3Fsort%3Dprice-asc",
      );
    });
  });
});
