"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Container } from "../ui/Primitives";

const FOOTER_GROUPS = [
  {
    title: "SHOP",
    links: [
      ["Shop All", "/shop"],
      ["Collections", "/collections"],
      ["New Arrivals", "/shop?new=1&sort=new"],
      ["Featured Collectibles", "/shop?featured=true"],
    ],
  },
  {
    title: "SERVICES",
    links: [
      ["Custom 3D Printing", "/3d-printing"],
      ["Order Tracking", "/account/orders"],
      ["FAQs", "/faqs"],
    ],
  },
  {
    title: "ACCOUNT",
    links: [
      ["My Account", "/account"],
      ["Wishlist", "/wishlist"],
      ["My Orders", "/account/orders"],
    ],
  },
  {
    title: "INFORMATION",
    links: [
      ["About HIMATU", "/about"],
      ["Contact", "/contact"],
      ["Shipping and Returns", "/shipping-returns"],
      ["Privacy Policy", "/privacy"],
      ["Terms and Conditions", "/terms"],
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="footer" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
      <Container>
        <div className="footer-top" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1.2fr", gap: "40px" }}>
          <div>
            <Link className="wordmark" href="/">
              HIMATU
            </Link>
            <p style={{ marginTop: "14px", color: "var(--cinematic-muted, #a1a1aa)", lineHeight: "1.6" }}>
              For the love of collecting.
              <br />
              Authentic anime statues & custom 3D resin printing in Bangladesh.
            </p>
            <div style={{ marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#a855f7", fontFamily: "var(--font-geist-mono), monospace" }}>
              <span>DISCOVER. COLLECT. DISPLAY.</span>
            </div>
          </div>

          {FOOTER_GROUPS.map((g) => (
            <div key={g.title}>
              <h3 style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#ffffff", marginBottom: "16px" }}>
                {g.title}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {g.links.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.65)",
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.65)")}
                  >
                    <span>{label}</span>
                    <ArrowUpRight size={12} opacity={0.6} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-bottom" style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
            © {new Date().getFullYear()} HIMATU. Authentic Figures & Bespoke 3D Printing. All rights reserved.
          </span>
          <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.3)", fontFamily: "var(--font-geist-mono), monospace" }}>
            DHAKA, BANGLADESH · NATIONWIDE SECURED FULFILLMENT
          </span>
        </div>
      </Container>
    </footer>
  );
}
