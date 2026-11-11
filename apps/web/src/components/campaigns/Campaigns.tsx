import Link from "next/link";
import { ArrowUpRight, MoveUpRight } from "lucide-react";
import { ButtonLink, Container } from "../ui/Primitives";
import { AssetImage } from "../products/AssetImage";
import { assets } from "@/lib/assets";
import { HeroSlideshow } from "./HeroSlideshow";
import { Reveal } from "../ui/Reveal";
export function HeroCampaign() {
  return (
    <section className="hero hero--cinematic">
      <div className="hero-visual">
        <HeroSlideshow />
        <Reveal className="hero-copy">
          <h1>
            YOUR FANDOM.
            <br />
            YOUR COLLECTION.
          </h1>
          <div className="hero-buttons">
            <ButtonLink href="/shop">SHOP THE COLLECTION</ButtonLink>
          </div>
        </Reveal>
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
      YOUR IMAGINATION.
      <br />
      MADE REAL.
    </>
  ),
  href = "/3d-printing",
  action = "DISCOVER 3D PRINTING",
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
            <p>Explore custom 3D printing possibilities with HIMATU.</p>
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
              CUSTOM DESIGN · CONCEPT STUDY
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
        COLLECT.
        <br />
        <span>DISPLAY.</span>
      </h2>
      <Link href="/about" className="text-link">
        THIS IS HIMATU
        <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}
