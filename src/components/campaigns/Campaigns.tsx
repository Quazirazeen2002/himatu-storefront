import Link from "next/link";
import { ArrowDown, ArrowUpRight, MoveUpRight } from "lucide-react";
import { ButtonLink, Container } from "../ui/Primitives";
import { AssetImage } from "../products/AssetImage";
import { assets } from "@/lib/assets";
import { Reveal } from "../ui/Reveal";
export function HeroCampaign() {
  return (
    <section className="hero">
      <div className="hero-visual">
        <div className="hero-topline">
          <span>THE HIMATU COLLECTION</span>
          <span>CURATED FOR YOUR WORLD</span>
        </div>
        <div className="hero-background-type" aria-hidden="true">
          HIMATU
        </div>
        <div className="hero-disc" />
        <div className="hero-figure">
          <AssetImage
            asset={assets.home}
            priority
            sizes="(max-width:767px) 100vw, 50vw"
          />
        </div>
        <Reveal className="hero-copy">
          <p className="eyebrow">
            <span className="red-mark" /> A WORLD WORTH COLLECTING
          </p>
          <h1>
            YOUR FANDOM.
            <br />
            YOUR COLLECTION.
          </h1>
          <p className="hero-description">
            Discover premium anime figures and collectibles,
            <br className="desktop-break" /> curated for fans who love to
            collect.
          </p>
          <div className="hero-buttons">
            <ButtonLink href="/shop">SHOP NOW</ButtonLink>
            <Link href="/collections" className="hero-secondary">
              EXPLORE COLLECTIONS
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </Reveal>
        <div className="hero-bottom">
          <span>HIMATU / ONE PIECE COLLECTION</span>
          <a href="#featured-figures" aria-label="Discover featured figures">
            <ArrowDown size={19} />
          </a>
        </div>
      </div>
      <div className="hero-footnote">
        <span>MADE FOR FANS. BUILT FOR COLLECTIONS.</span>
        <span>ANIME FIGURES / CHARACTER COLLECTIBLES / CUSTOM CREATIONS</span>
      </div>
    </section>
  );
}
export function CampaignBanner({
  title = (
    <>
      THE WORLD
      <br />
      OF COLLECTING.
    </>
  ),
  eyebrow = "MORE THAN A FIGURE",
  description = (
    <>
      The characters that stay with you.
      <br />
      The stories you make room for.
    </>
  ),
  href = "/campaign",
  action = "EXPLORE THE WORLD",
}: {
  title?: React.ReactNode;
  eyebrow?: string;
  description?: React.ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <section className="editorial">
      <div className="editorial-art">
        <div className="editorial-ring" />
        <AssetImage asset={assets.editorial[0]} />
        <AssetImage asset={assets.editorial[1]} />
        <span className="art-label">ORIGINAL HIMATU PHOTOGRAPHY</span>
      </div>
      <Reveal className="editorial-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <ButtonLink href={href}>{action}</ButtonLink>
      </Reveal>
    </section>
  );
}
export function PrintingCampaign({
  title = (
    <>
      BRING YOUR
      <br />
      FAVOURITE
      <br />
      CHARACTERS TO LIFE.
    </>
  ),
  href = "/3d-printing",
  action = "EXPLORE 3D PRINTING",
}: {
  title?: React.ReactNode;
  href?: string;
  action?: string;
}) {
  return (
    <section className="printing-section">
      <Container>
        <div className="printing-layout">
          <Reveal>
            <p className="eyebrow">HIMATU CUSTOM / 3D PRINTING</p>
            <h2>{title}</h2>
            <p>Explore custom 3D printing for unique collectible creations.</p>
            <ButtonLink href={href} variant="outline">
              {action}
            </ButtonLink>
          </Reveal>
          <div className="printing-art">
            <span className="eyebrow">FROM AN IDEA. INTO YOUR WORLD.</span>
            <div className="printing-process-art" aria-hidden="true">
              <span>3D</span>
              <div className="process-layers" />
            </div>
            <span className="art-label">
              PROCESS ILLUSTRATION · PROJECT PHOTOS COMING SOON
            </span>
            <MoveUpRight className="printing-arrow" size={42} strokeWidth={1} />
          </div>
        </div>
      </Container>
    </section>
  );
}
export function BrandMessage() {
  return (
    <section className="brand-message">
      <p className="eyebrow">YOUR WORLD. ONE FIGURE AT A TIME.</p>
      <h2>
        DISCOVER.
        <br />
        COLLECT. <span>DISPLAY.</span>
      </h2>
      <Link href="/about" className="text-link">
        THIS IS HIMATU
        <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}
