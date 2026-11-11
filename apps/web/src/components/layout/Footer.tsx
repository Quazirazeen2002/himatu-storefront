"use client";

import Link from "next/link";
import { VideoSocialLinks } from "./VideoSocialLinks";
import { BrandLogo } from "./BrandLogo";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Facebook, Instagram } from "lucide-react";
import { Container } from "../ui/Primitives";
const groups = [
  {
    title: "Explore",
    links: [
      ["Shop all", "/shop"],
      ["Product Categories", "/categories"],
      ["New Arrivals", "/shop?new=1&sort=new"],
      ["Collections", "/collections"],
      ["Custom 3D Printing", "/3d-printing"],
      ["About Himatu", "/about"],
    ],
  },
  {
    title: "Here to help",
    links: [
      ["Contact", "/contact"],
      ["FAQs", "/faqs"],
      ["Shipping & Returns", "/shipping-returns"],
    ],
  },
  {
    title: "The fine print",
    links: [
      ["Privacy Policy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
];
export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="footer">
      <Container>
        <div className="footer-top">
          <div>
            <Link className="wordmark" href="/" aria-label="HIMATU home">
              <BrandLogo signature />
            </Link>
            <p>
              For the love of collecting.
              <br />
              From Bangladesh, with fandom.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3>{g.title}</h3>
              {g.links.map(([label, href]) => (
                <Link key={href} href={href}>
                  {label}
                  <ArrowUpRight size={13} />
                </Link>
              ))}
            </div>
          ))}
          <div>
            <h3>Your fandom. Connected.</h3>
            <p>Find your people. Follow HIMATU.</p>
            <div className="footer-socials">
              <a className="social-facebook" href="https://www.facebook.com/share/1K5JUqWxwn/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Follow HIMATU on Facebook (opens in new tab)"><Facebook size={22} aria-hidden="true" /><span>Facebook<small>Join our community</small></span><ArrowUpRight size={16} /></a>
              <a className="social-instagram" href="https://www.instagram.com/himatuofficial?mdxt=MTQ2dXRoNW1nYnllcQ==" target="_blank" rel="noopener noreferrer" aria-label="Follow HIMATU on Instagram (opens in new tab)"><Instagram size={22} aria-hidden="true" /><span>Instagram<small>@himatuofficial</small></span><ArrowUpRight size={16} /></a>
              <VideoSocialLinks />
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 HIMATU</span>
          <span>OFFICIAL ANIME COLLECTIBLES</span>
          <span>BANGLADESH / EN / BDT</span>
        </div>
      </Container>
    </footer>
  );
}
