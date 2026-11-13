import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Layers3,
  MessageCircle,
  Truck,
  Sparkles,
  CheckCircle2,
  Box,
} from "lucide-react";
import { BrandStory } from "./BrandStory";

const heroPhoto = "/images/figures/867640567_122155861473356138_4650069518476672319_n.jpg";
const zoroPhoto = "/images/figures/862314978_122155859979356138_1917160491667365230_n.jpg";
const luffyCaptainPhoto = "/images/figures/867463200_122155860927356138_2040773041185832800_n.jpg";
const shelfPhoto = "/images/collections/action-figures-shelf.jpeg";

const pillars = [
  {
    number: "01",
    tag: "CURATION",
    title: "Relentless Quality Standard",
    description:
      "We strictly reject counterfeit and bootleg runs. Every piece in the HIMATU collection is verified for sculpt fidelity, anatomic proportion, dynamic balance, and hand-finished paint gradients.",
    Icon: ShieldCheck,
  },
  {
    number: "02",
    tag: "ENGINEERING",
    title: "Custom 3D Printing Lab",
    description:
      "Beyond catalog figures, our in-house 3D printing laboratory turns your original 3D models and character ideas into physical reality with 0.02mm layer precision and UV-cured resin finishing.",
    Icon: Cpu,
  },
  {
    number: "03",
    tag: "FULFILLMENT",
    title: "Armored Nationwide Dispatch",
    description:
      "Every collectible is encased in multi-layer shock-absorbing air cushions and heavy-gauge corrugated outer boxes, ensuring perfect mint-box delivery across all 64 districts in Bangladesh.",
    Icon: Truck,
  },
  {
    number: "04",
    tag: "CULTURE",
    title: "Direct Collector Concierge",
    description:
      "Real collectors helping real collectors. Request live studio photos, unboxing checks, display lighting advice, or custom project quotations directly via WhatsApp or in-app support.",
    Icon: MessageCircle,
  },
];

const stats = [
  { value: "64", unit: "/ 64", label: "Districts Delivered Across Bangladesh" },
  { value: "100%", unit: "Authentic", label: "Verified Sculpt Fidelity & Zero Bootlegs" },
  { value: "0.02", unit: "mm", label: "Layer Precision in Custom 3D Resin Lab" },
  { value: "24/7", unit: "Support", label: "Direct Collector Concierge via WhatsApp" },
];

export function AboutPage() {
  return (
    <div className="about-page">
      {/* 1. Nike-Style Cinematic Manifesto Hero */}
      <header className="about-hero">
        <Image
          src={heroPhoto}
          alt="HIMATU Anime Figure Studio Presentation"
          fill
          priority
          sizes="100vw"
          className="about-hero-bg"
        />
        <div className="about-hero-shade" />

        <div className="about-hero-copy">
          <div className="about-hero-eyebrow">
            <span className="about-live-dot" />
            <span>HIMATU ARCHIVE · EST. 2024 · DHAKA, BANGLADESH</span>
          </div>

          <h1>
            WE DON’T JUST COLLECT.
            <br />
            WE IMMORTALIZE.
          </h1>

          <p className="about-hero-lead">
            A brand born for anime fans, collectors, and creators across Bangladesh.
            Built with relentless devotion to character soul, sculpt precision, and
            the art of personal display.
          </p>

          <div className="about-hero-badges">
            <span>01 / AUTHENTIC FIGURES</span>
            <span>02 / 3D RESIN LAB</span>
            <span>03 / 64 DISTRICTS DISPATCH</span>
            <span>04 / CURATED CULTURE</span>
          </div>
        </div>
      </header>

      {/* 2. Brand Manifesto (Nike & Adidas Editorial Split) */}
      <section id="about-story" className="about-intro">
        <div className="about-intro-text">
          <p className="eyebrow">THE PHILOSOPHY</p>
          <h2>
            STORIES AREN’T MEANT
            <br />
            <span>TO STAY ON SCREENS.</span>
          </h2>

          <p className="about-intro-highlight">
            A character isn’t just lines of ink or frames of digital animation. It’s
            the moment Luffy stood smiling against impossible odds. The quiet fire in
            Zoro’s vow. The world that made you believe in yourself.
          </p>

          <p>
            HIMATU was created to give those moments physical weight. We bridge the gap
            between passive streaming and tangible personal space. Whether you are
            curating your first study desk or expanding a museum-tier glass cabinet,
            we believe what you put on your shelf reflects the stories that define who
            you are.
          </p>

          <div className="about-intro-quote">
            <blockquote>
              “The shelf is not just furniture. It is your own private universe.”
            </blockquote>
            <cite>— The HIMATU Creative Collective</cite>
          </div>

          <div className="about-intro-actions">
            <Link href="/collections" className="button button--primary">
              EXPLORE THE UNIVERSES <ArrowUpRight size={16} />
            </Link>
            <Link href="/3d-printing" className="button button--outline">
              CUSTOM 3D LAB <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Editorial Photo Card with Technical Specs */}
        <div className="about-intro-showcase">
          <div className="about-spec-card">
            <div className="about-spec-image-wrap">
              <Image
                src={zoroPhoto}
                alt="Zoro Asura collectible figure photographed in studio for HIMATU"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="about-spec-img"
              />
              <span className="about-spec-tag">STUDIO ARCHIVE SPECIMEN</span>
            </div>
            <div className="about-spec-meta">
              <div>
                <strong>PIRATE HUNTER · THREE THOUSAND WORLDS</strong>
                <small>Sculpt Material: High-density impact-resistant composite</small>
              </div>
              <span className="about-spec-status">MINT VERIFIED</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Adidas-Style High-Impact Authority Stats Strip */}
      <section className="about-stats-strip" aria-label="HIMATU by the numbers">
        <div className="about-stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="about-stat-item">
              <div className="about-stat-number">
                <span>{stat.value}</span>
                <span className="about-stat-unit">{stat.unit}</span>
              </div>
              <p className="about-stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. The Four Pillars (Adidas Performance & Disciplines Grid) */}
      <section className="about-pillars">
        <div className="about-section-heading">
          <p className="eyebrow">OUR DISCIPLINES</p>
          <h2>HOW HIMATU OPERATES.</h2>
          <p>
            From curation and studio inspection to nationwide armored transit, every
            step is designed by collectors, for collectors.
          </p>
        </div>

        <div className="about-pillar-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.Icon;
            return (
              <article key={pillar.number} className="about-pillar-card">
                <div className="about-pillar-top">
                  <span className="about-pillar-num">{pillar.number}</span>
                  <span className="about-pillar-tag">{pillar.tag}</span>
                </div>
                <div className="about-pillar-icon-wrap">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. The Studio & Craftsmanship Story */}
      <section className="about-craft">
        <div className="about-craft-inner">
          <div className="about-craft-header">
            <p className="eyebrow">THE CRAFT OF DISPLAY</p>
            <h2>ENGINEERED FOR THE SHELF.</h2>
            <p>
              Every figure’s center of gravity, material sheen, and lighting responsiveness
              is tested before it enters your home.
            </p>
          </div>

          <div className="about-craft-grid">
            <div className="about-craft-card">
              <div className="about-craft-img-wrap">
                <Image
                  src={luffyCaptainPhoto}
                  alt="Luffy Gear Fifth sculpt in studio light"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="about-craft-caption">
                <h4>DYNAMIC BALANCE & LIGHTING</h4>
                <p>
                  Figures engineered with dynamic gravity distribution so displays stay
                  poised and stable for years without sagging or warping.
                </p>
              </div>
            </div>

            <div className="about-craft-card">
              <div className="about-craft-img-wrap">
                <Image
                  src={shelfPhoto}
                  alt="Curated anime action figure collection shelf"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="about-craft-caption">
                <h4>THE ART OF CURATION</h4>
                <p>
                  From One Piece and Naruto to Dragon Ball, Jujutsu Kaisen, and custom 3D
                  resin prints, we curate characters that spark real pride.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive GSAP H-I-M-A-T-U Brand Story */}
      <BrandStory />

      {/* 7. Nike-Style Call To Action Finale */}
      <section className="about-finale">
        <div className="about-finale-content">
          <p className="eyebrow">THE NEXT CHAPTER</p>
          <h2>
            YOUR FANDOM.
            <br />
            YOUR SPACE.
            <br />
            <span>YOUR UNIVERSE.</span>
          </h2>
          <p className="about-finale-sub">
            Whether you want an authentic imported figure or an original custom 3D
            resin sculpt, start your collection journey today.
          </p>
          <div className="about-finale-buttons">
            <Link href="/shop" className="button button--primary">
              EXPLORE ALL FIGURES <ArrowUpRight size={17} />
            </Link>
            <Link href="/3d-printing" className="button button--outline">
              CUSTOM 3D INQUIRY <ArrowUpRight size={17} />
            </Link>
            <Link href="/contact" className="button button--outline">
              CONTACT HIMATU TEAM <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
