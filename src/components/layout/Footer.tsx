import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "../ui/Primitives";
const groups = [
  {
    title: "Explore",
    links: [
      ["Shop all", "/shop"],
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
  return (
    <footer className="footer">
      <Container>
        <div className="footer-top">
          <div>
            <Link className="wordmark" href="/">
              HIMATU
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
            <h3>Stay in the loop</h3>
            <p>
              Official social channels
              <br />
              will be announced at launch.
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 HIMATU</span>
          <span>STAGE 2 · STOREFRONT PREVIEW</span>
          <span>BANGLADESH / EN / BDT</span>
        </div>
      </Container>
    </footer>
  );
}
