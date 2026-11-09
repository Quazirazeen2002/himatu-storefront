"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Check, MoveUpRight } from "lucide-react";
import { BrandLogo } from "../layout/BrandLogo";
import { collections } from "@/lib/config";
import { brandChapters } from "@/lib/brand-story";

function StoryVisual({ index }: { index: number }) {
  const chapter = brandChapters[index];
  return <div className="hstory-type-scene" aria-hidden="true"><span className="hstory-type-number">0{index + 1} / THE HIMATU STORY</span><span className="hstory-type-letter">{chapter.letter}</span><span className="hstory-type-word">{chapter.word}</span><p>{chapter.takeaway}</p></div>;
}

export function BrandStory() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const [universe, setUniverse] = useState("one-piece");
  const chosen = collections.find(item => item.slug === universe) || collections[0];

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const chapters = Array.from(root.querySelectorAll<HTMLElement>("[data-story-chapter]"));
    const observer = new IntersectionObserver(() => {
      const probe = window.innerHeight * .43;
      const index = chapters.findIndex(chapter => { const bounds = chapter.getBoundingClientRect(); return bounds.top <= probe && bounds.bottom > probe; });
      if (index >= 0) setActive(previous => previous === index ? previous : index);
    }, { rootMargin: "-35% 0px -50% 0px", threshold: 0 });
    chapters.forEach(chapter => observer.observe(chapter));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2)) return;
    let cancelled = false;
    let started = false;
    let nearby = false;
    let cleanup: (() => void) | undefined;
    const media = window.matchMedia("(min-width: 1100px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)");
    async function initialize() {
      if (!nearby || !media.matches || started || cancelled) return;
      started = true;
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
        if (cancelled || !root) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        cleanup = () => mm.revert();
        mm.add(media.media, () => {
          root.dataset.enhanced = "true";
          const stage = root.querySelector<HTMLElement>(".hstory-stage")!;
          const body = root.querySelector<HTMLElement>(".hstory-chapters")!;
          const chapters = Array.from(root.querySelectorAll<HTMLElement>("[data-story-chapter]"));
          const scenes = Array.from(root.querySelectorAll<HTMLElement>(".hstory-stage-scene"));
          const letters = Array.from(root.querySelectorAll<HTMLElement>(".hstory-letter"));
          gsap.set(scenes, { autoAlpha: 0 });
          gsap.set(scenes[0], { autoAlpha: 1 });
          ScrollTrigger.create({ trigger: stage, start: "top 156px", endTrigger: body, end: "bottom bottom", pin: true, pinSpacing: false, invalidateOnRefresh: true });
          chapters.forEach((chapter,index) => {
            if (index > 0) gsap.fromTo(scenes[index], { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, ease: "none", scrollTrigger: { trigger: chapter, start: "top 70%", end: "top 36%", scrub: true } });
            gsap.fromTo(letters[index], { y: 12, scale: .94, opacity: .25 }, { y: -6, scale: 1.1, opacity: 1, ease: "none", scrollTrigger: { trigger: chapter, start: "top 80%", end: "top 35%", scrub: true } });
            gsap.fromTo(chapter.querySelectorAll("[data-heading-character]"), { yPercent: 85, opacity: .2 }, { yPercent: 0, opacity: 1, stagger: .045, ease: "none", scrollTrigger: { trigger: chapter, start: "top 85%", end: "top 45%", scrub: true } });
            const photograph = scenes[index].querySelector("[data-photo-motion]");
            if (photograph) gsap.fromTo(photograph, { scale: 1.015 }, { scale: 1.1, ease: "none", scrollTrigger: { trigger: chapter, start: "top bottom", end: "bottom top", scrub: true } });
          });
          gsap.fromTo(root.querySelector(".hstory-progress-fill"), { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: body, start: "top center", end: "bottom center", scrub: true } });
          gsap.fromTo(root.querySelectorAll(".hstory-reunite-letter"), { y: 60, x: index => (index - 2.5) * 30, opacity: .2 }, { y: 0, x: 0, opacity: 1, stagger: .07, ease: "none", scrollTrigger: { trigger: ".hstory-outro", start: "top 90%", end: "top 40%", scrub: true } });
          const refresh = () => { if (!cancelled) ScrollTrigger.refresh(); };
          document.fonts.ready.then(refresh);
          const images = Array.from(stage.querySelectorAll("img"));
          images.forEach(image => image.addEventListener("load", refresh, { once: true }));
          return () => {
            root.removeAttribute("data-enhanced");
            images.forEach(image => image.removeEventListener("load", refresh));
            root.querySelectorAll<HTMLElement>(".hstory-stage-scene, .hstory-letter, [data-heading-character], [data-photo-motion], .hstory-reunite-letter, .hstory-progress-fill").forEach(element => {
              for (const property of ["transform", "opacity", "visibility"]) element.style.removeProperty(property);
            });
          };
        }, root);
      } catch {
        cleanup?.();
        root?.removeAttribute("data-enhanced");
        // The complete story and controls remain usable without the optional motion engine.
      }
    }
    const approach = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { nearby = true; void initialize(); } }, { rootMargin: "900px" });
    approach.observe(root);
    const onMediaChange = () => { void initialize(); };
    media.addEventListener("change", onMediaChange);
    return () => { cancelled = true; approach.disconnect(); media.removeEventListener("change", onMediaChange); cleanup?.(); };
  }, []);

  return <section ref={ref} className="hstory" style={{ "--story-progress": (active + 1) / brandChapters.length } as CSSProperties} id="himatu-story" aria-labelledby="hstory-title">
    <div className="hstory-intro">
      <p className="eyebrow"><span className="red-mark" /> THE MEANING WE MAKE</p>
      <h2 id="hstory-title">SIX LETTERS.<br /><span>A WORLD OF CONNECTION.</span></h2>
      <div className="hstory-intro-bottom"><p>Heroes. Imagination. Memories. Artistry. Treasures. Universe. Explore six ideas that bring the HIMATU name to life.</p><a href="#himatu-heroes" className="text-link">SCROLL INTO THE STORY <ArrowDown size={16} /></a></div>
    </div>
    <nav className="hstory-navigation" aria-label="HIMATU story chapters">
      <span className="hstory-nav-caption">THE HIMATU STORY</span>
      <div className="hstory-chapter-links">{brandChapters.map((chapter,index) => <motion.a tabIndex={0} key={chapter.id} href={`#himatu-${chapter.id}`} aria-label={`${chapter.letter} — ${chapter.word}`} aria-current={active === index ? "step" : undefined} whileTap={reduced ? undefined : { scale: .96 }}>
        {active === index && <motion.span className="hstory-nav-active" layoutId={reduced ? undefined : "himatu-story-active"} transition={{ duration: .25 }} />}
        <span className="hstory-nav-letter">{chapter.letter}</span><span className="hstory-nav-word">{chapter.word}</span>
      </motion.a>)}</div>
      <span className="hstory-nav-count" aria-hidden="true">0{active + 1} / 06</span>
      <div className="hstory-progress" aria-hidden="true"><span className="hstory-progress-fill" /></div>
    </nav>
    <div className="hstory-layout">
      <div className="hstory-stage" aria-label="Visual companion to the story">
        <div className="hstory-letter-rack" aria-hidden="true">{brandChapters.map((chapter,index) => <span key={chapter.id} className={`hstory-letter ${active === index ? "is-active" : ""}`}>{chapter.letter}</span>)}</div>
        <div className="hstory-stage-viewport">{brandChapters.map((chapter,index) => <div className="hstory-stage-scene" key={chapter.id} data-active={active === index} inert={active !== index ? true : undefined} aria-hidden={active !== index}><StoryVisual index={index} /></div>)}</div>
        <div className="hstory-stage-footer"><span>{brandChapters[active].word.toUpperCase()}</span><span>SCROLL TO EXPLORE <MoveUpRight size={12} /></span></div>
      </div>
      <div className="hstory-chapters">{brandChapters.map((chapter,index) => <article className="hstory-chapter" key={chapter.id} data-story-chapter id={`himatu-${chapter.id}`} tabIndex={-1} aria-labelledby={`hstory-heading-${chapter.id}`}>
        <div className="hstory-chapter-meta"><span>0{index + 1} / 06</span><span>{chapter.kicker}</span></div>
        <h3 id={`hstory-heading-${chapter.id}`} className="hstory-chapter-word" aria-label={chapter.word}><span data-heading-token aria-hidden="true">{Array.from(chapter.word.toUpperCase()).map((character, position) => <span key={`${position}-${character}`} data-heading-character className={position === 0 ? "hstory-heading-letter" : undefined}>{character}</span>)}</span></h3>
        <h4>{chapter.title}</h4>
        <div className="hstory-mobile-visual"><StoryVisual index={index} /></div>
        {chapter.paragraphs.map(paragraph => <p className="hstory-paragraph" key={paragraph.slice(0,35)}>{paragraph}</p>)}
        <p className="hstory-takeaway"><span aria-hidden="true">↳</span>{chapter.takeaway}</p>
        {index === 1 && <Link href="/3d-printing" className="text-link">DISCUSS A CUSTOM IDEA <ArrowUpRight size={16} /></Link>}
        {index === 5 && <fieldset className="hstory-universe-picker"><legend>Where would you like to go next?</legend><p>Your choice only changes the collection link below.</p><div>{collections.map(collection => <motion.button tabIndex={0} type="button" key={collection.slug} aria-pressed={universe === collection.slug} onClick={() => setUniverse(collection.slug)} whileTap={reduced ? undefined : { scale: .97 }}>{collection.name}{universe === collection.slug && <Check size={13} />}</motion.button>)}</div></fieldset>}
      </article>)}</div>
    </div>
    <div className="hstory-outro">
      <p className="eyebrow">SIX IDEAS. ONE NAME. YOUR OWN CONNECTION.</p>
      <div className="hstory-reunited" aria-label="HIMATU">{brandChapters.map(chapter => <span key={chapter.id} className="hstory-reunite-letter" aria-hidden="true">{chapter.letter}</span>)}</div>
      <div className="hstory-outro-bottom"><div><BrandLogo /><p>A new interpretation of the name.<br />An invitation to build your own universe.</p></div><div className="hstory-outro-actions"><Link href={`/collections/${chosen.slug}`} className="button button--primary">EXPLORE {chosen.name.toUpperCase()} <ArrowUpRight size={17} /></Link><a href="https://www.facebook.com/Himatuofficial" target="_blank" rel="noopener noreferrer" className="text-link">FOLLOW HIMATU ON FACEBOOK <ArrowUpRight size={15} /></a></div></div>
    </div>
  </section>;
}
