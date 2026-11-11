"use client";

import Image from "next/image";
import { Pause, Play, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { figurePhotos } from "@/lib/assets";

const defaultSlides = [
  figurePhotos["luffy-gear-five-action"],
  figurePhotos["zoro-asura"],
  figurePhotos["zoro-three-sword-style"],
  figurePhotos["straw-hat-captain"],
];

export function HeroSlideshow() {
  const [slides, setSlides] = useState(defaultSlides);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {let active=true;fetch("/api/v1/content/hero",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(active&&Array.isArray(data?.slides)&&data.slides.length){setCurrent(0);setSlides(data.slides.map((s:{src:string;alt:string},i:number)=>({...s,id:`hero-${i}`,width:1600,height:1000,placeholder:false})));}}).catch(()=>{});return()=>{active=false;};}, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reduced || interacting) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setCurrent((index) => (index + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, reduced, interacting, slides.length]);

  function select(index: number) {
    setCurrent((index + slides.length) % slides.length);

  }

  return (
    <div className={`hero-slideshow ${paused || reduced || interacting ? "is-paused" : ""}`} role="region" aria-roledescription="carousel" aria-label="HIMATU product photography"
      onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}>
      {slides.map((asset, index) => (
        <div key={asset.id} className={`hero-photo-slide ${index === current ? "is-active" : ""}`} aria-hidden={index !== current}>
          <Image unoptimized={asset.src?.startsWith("https://")} src={asset.src!} alt={asset.alt} fill sizes="100vw" preload={index === 0} loading={index === 0 ? undefined : "eager"} />
        </div>
      ))}
      <div className="hero-photo-shade" />
      <div className="hero-slide-controls">
        <span className="hero-slide-count" aria-live={paused ? "polite" : "off"}>0{current + 1}<span> / 0{slides.length}</span></span>
        <button type="button" aria-label="Previous hero photograph" onClick={() => select(current - 1)}><ArrowLeft size={17} /></button>
        <button type="button" aria-label="Next hero photograph" onClick={() => select(current + 1)}><ArrowRight size={17} /></button>
        {!reduced && <button type="button" aria-label={paused ? "Play hero slideshow" : "Pause hero slideshow"} onClick={() => { setPaused(!paused); if (paused) setInteracting(false); }}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}
      </div>
    </div>
  );
}
