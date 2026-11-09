"use client";
import Image from "next/image";
import { figurePhotos } from "@/lib/assets";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, ArrowUpRight } from "lucide-react";
const chapters = [
  { name: "Sculpt", title: "IT STARTS WITH A SHAPE.", text: "A character takes form through pose, proportion and sculpted detail." },
  { name: "Print", title: "LAYER BY LAYER.", text: "A digital form becomes a physical study, built one layer at a time." },
  { name: "Finish", title: "DETAIL MAKES THE DIFFERENCE.", text: "Surface preparation and colour bring depth and personality to the sculpt." },
  { name: "Display", title: "READY FOR ITS OWN SPACE.", text: "The finished composition brings the character, base and silhouette together." },
];

export function MakingOf() {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .15 });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);
  useEffect(() => {
    if (paused || reduced || !inView) return;
    const timer = window.setInterval(() => { if (!document.hidden) setPhase(previous => (previous + 1) % chapters.length); }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, reduced, inView]);
  const chapter = chapters[phase];
  return (
    <section ref={ref} className={`making-of ${paused || reduced || !inView ? "is-paused" : ""}`} aria-labelledby="making-of-title">
      <div className="making-of-intro"><p className="eyebrow">THE MAKING OF A CHARACTER</p><h2 id="making-of-title">FROM A SPARK.<br /><span>TO YOUR SHELF.</span></h2><p>A moving exploration of the steps behind a collectible.</p></div>
      <div className="making-of-film">
        <div className={`making-of-stage making-of-stage--${phase}`} key={phase}>
          <Image src={figurePhotos["zoro-three-sword-style"].src!} alt="Original HIMATU photograph of Roronoa Zoro, used in an animated study of form and detail" fill sizes="(max-width:767px) 100vw, 60vw" />
          <div className="making-of-color" aria-hidden="true"><Image src={figurePhotos["zoro-three-sword-style"].src!} alt="" fill sizes="(max-width:767px) 100vw, 60vw" /></div>
          <div className="making-of-grid" aria-hidden="true" /><div className="making-of-scan" aria-hidden="true" />
          <span className="making-of-stage-label">0{phase + 1} / {chapter.name.toUpperCase()}</span>
          <span className="making-of-note">ORIGINAL HIMATU PHOTOGRAPH · ANIMATED STUDY</span>
        </div>
        <div className="making-of-copy">
          <p className="eyebrow">CHAPTER 0{phase + 1} / 04</p>
          <h3>{chapter.title}</h3><p>{chapter.text}</p>
          <div className="making-of-chapters" role="group" aria-label="Making-of chapters">
            {chapters.map((item, index) => <button key={item.name} type="button" aria-pressed={index === phase} onClick={() => { setPhase(index); setPaused(true); }}><span>0{index + 1}</span>{item.name}</button>)}
          </div>
          {!reduced && <button className="making-of-play text-link" type="button" onClick={() => setPaused(!paused)}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? "PLAY SEQUENCE" : "PAUSE SEQUENCE"}</button>}
          <Link href="/3d-printing" className="text-link">EXPLORE CUSTOM 3D PRINTING <ArrowUpRight size={16} /></Link>
          <p className="making-of-disclosure">A stylized sequence using your original HIMATU product photograph. The visual treatments explain a general creative process; they are not workshop footage or manufacturing evidence for this figure.</p>
        </div>
      </div>
    </section>
  );
}
