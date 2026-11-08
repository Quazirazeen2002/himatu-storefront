"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Printer, CheckCircle } from "lucide-react";
import gsap from "gsap";

export function HeroSection() {
  const rootRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const heroFigureRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLAnchorElement>(null);
  const card2Ref = useRef<HTMLAnchorElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        // If reduced motion is preferred, immediately show elements without motion
        gsap.set(
          [
            headlineRef.current,
            descRef.current,
            ctaRef.current,
            benefitsRef.current,
            heroFigureRef.current,
            card1Ref.current,
            card2Ref.current,
            haloRef.current,
          ],
          { opacity: 1, y: 0, scale: 1 }
        );
        return;
      }

      // 1. Initial State
      gsap.set(haloRef.current, { opacity: 0, scale: 0.8 });
      gsap.set(heroFigureRef.current, { opacity: 0, y: 50, scale: 0.94 });
      gsap.set(card1Ref.current, { opacity: 0, y: 40, x: -20 });
      gsap.set(card2Ref.current, { opacity: 0, y: 40, x: 20 });
      gsap.set(".hero-headline-line", { opacity: 0, y: 45 });
      gsap.set(descRef.current, { opacity: 0, y: 25 });
      gsap.set(ctaRef.current?.children || [], { opacity: 0, y: 20 });
      gsap.set(benefitsRef.current?.children || [], { opacity: 0, y: 15 });

      // 2. Cinematic Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(haloRef.current, { opacity: 0.8, scale: 1, duration: 1.6 }, 0.1)
        .to(
          heroFigureRef.current,
          { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: "power2.out" },
          0.2
        )
        .to(
          ".hero-headline-line",
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.14 },
          0.3
        )
        .to(descRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.6)
        .to(
          ctaRef.current?.children || [],
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 },
          0.7
        )
        .to(
          [card1Ref.current, card2Ref.current],
          { opacity: 1, y: 0, x: 0, duration: 0.9, stagger: 0.2, ease: "back.out(1.4)" },
          0.8
        )
        .to(
          benefitsRef.current?.children || [],
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
          0.9
        );

      // 3. Continuous Gentle Figurine Levitation
      gsap.to(heroFigureRef.current, {
        y: -12,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.6,
      });

      // 4. Subtle Floating Card Floating Animation
      gsap.to(card1Ref.current, {
        y: -8,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.8,
      });
      gsap.to(card2Ref.current, {
        y: 8,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2.1,
      });
    }, rootRef);

    // Interactive Mouse Parallax for Desktop
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion || window.innerWidth < 992) return;
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 2;
      const yPos = (clientY / window.innerHeight - 0.5) * 2;

      gsap.to(heroFigureRef.current, {
        x: xPos * 18,
        rotationY: xPos * 6,
        duration: 1.2,
        ease: "power1.out",
      });
      gsap.to(card1Ref.current, {
        x: -xPos * 12,
        y: -yPos * 10,
        duration: 1.4,
        ease: "power1.out",
      });
      gsap.to(card2Ref.current, {
        x: xPos * 14,
        y: yPos * 12,
        duration: 1.4,
        ease: "power1.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={rootRef} className="cinematic-hero" aria-label="Hero Showcase">
      <div className="hero-atmosphere" aria-hidden="true">
        <div ref={haloRef} className="hero-glow-orb" />
        <div className="hero-ambient-grid" />
        <div className="hero-watermark">HIMATU</div>
      </div>

      <div className="hero-container">
        {/* LEFT COLUMN: HERO COPY */}
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            <span>PREMIUM ANIME FIGURES & COLLECTIBLES</span>
          </div>

          <h1 ref={headlineRef} className="hero-headline">
            <span className="hero-headline-line" style={{ display: "block" }}>
              BRING YOUR
            </span>
            <span
              className="hero-headline-line hero-headline-highlight"
              style={{ display: "block" }}
            >
              ANIME WORLD
            </span>
            <span className="hero-headline-line" style={{ display: "block" }}>
              TO LIFE.
            </span>
          </h1>

          <p ref={descRef} className="hero-description">
            Discover premium anime figures and collectibles, carefully curated for fans and collectors.
          </p>

          <div ref={ctaRef} className="hero-actions">
            <Link href="/collections" className="btn-primary-purple">
              <span>SHOP COLLECTIONS</span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/3d-printing" className="btn-secondary-purple">
              <span>CUSTOM 3D PRINTING</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div ref={benefitsRef} className="hero-benefits-grid">
            <div className="hero-benefit-item">
              <Sparkles size={16} />
              <span>Curated Anime Collections</span>
            </div>
            <div className="hero-benefit-item">
              <Shield size={16} />
              <span>Premium Collectibles</span>
            </div>
            <div className="hero-benefit-item">
              <Printer size={16} />
              <span>Custom 3D Printing</span>
            </div>
            <div className="hero-benefit-item">
              <CheckCircle size={16} />
              <span>Secure Nationwide Ordering</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HERO FIGURINE COMPOSITION */}
        <div className="hero-visual-stage">
          <div className="hero-figure-halo" />
          <div className="hero-figure-pedestal" />

          {/* Central Hero Figurine */}
          <div ref={heroFigureRef} className="hero-figure-img-wrap">
            <Image
              src="/images/figures/867155812_122155861425356138_1955209043147405711_n.jpg"
              alt="Roronoa Zoro Three Sword Style Figure with Purple Effects"
              width={760}
              height={980}
              priority
              quality={90}
            />
          </div>

          {/* Floating Card 1: Zoro Three Sword Style */}
          <Link
            ref={card1Ref}
            href="/products/zoro-three-sword-style"
            className="floating-card floating-card-1"
          >
            <div className="floating-thumb">
              <Image
                src="/images/figures/867155812_122155861425356138_1955209043147405711_n.jpg"
                alt="Zoro Figure"
                width={52}
                height={52}
              />
            </div>
            <div className="floating-info">
              <span className="floating-tag">ONE PIECE</span>
              <strong className="floating-title">Zoro · Three Sword Style</strong>
              <span className="floating-price">৳ 4,800 BDT</span>
            </div>
          </Link>

          {/* Floating Card 2: Luffy Gear Five */}
          <Link
            ref={card2Ref}
            href="/products/straw-hat-captain"
            className="floating-card floating-card-2"
          >
            <div className="floating-thumb">
              <Image
                src="/images/figures/874109780_122155860429356138_159630139292783632_n.jpg"
                alt="Luffy Gear Five Figure"
                width={52}
                height={52}
              />
            </div>
            <div className="floating-info">
              <span className="floating-tag">ONE PIECE</span>
              <strong className="floating-title">Luffy · Gear Five</strong>
              <span className="floating-price">৳ 6,500 BDT</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
