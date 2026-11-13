"use client";

import Image from "next/image";
import { Pause, Play, ArrowLeft, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { figurePhotos } from "@/lib/assets";

export interface HeroSlideItem {
  id: string;
  type: "video" | "image";
  src: string;
  poster?: string;
  alt: string;
}

const defaultSlides: HeroSlideItem[] = [
  {
    id: "hero-video-one-piece",
    type: "video",
    src: "/videos/hero-anime.mp4",
    poster: "/videos/hero-anime-poster.jpg",
    alt: "HIMATU One Piece Anime Cinematic Visual",
  },
  {
    id: "hero-photo-1",
    type: "image",
    src: figurePhotos["luffy-gear-five-action"].src!,
    alt: figurePhotos["luffy-gear-five-action"].alt,
  },
  {
    id: "hero-photo-2",
    type: "image",
    src: figurePhotos["zoro-asura"].src!,
    alt: figurePhotos["zoro-asura"].alt,
  },
  {
    id: "hero-photo-3",
    type: "image",
    src: figurePhotos["zoro-three-sword-style"].src!,
    alt: figurePhotos["zoro-three-sword-style"].alt,
  },
  {
    id: "hero-photo-4",
    type: "image",
    src: figurePhotos["straw-hat-captain"].src!,
    alt: figurePhotos["straw-hat-captain"].alt,
  },
];

export function HeroSlideshow() {
  const [slides, setSlides] = useState<HeroSlideItem[]>(defaultSlides);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync video play/pause with carousel state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (current === 0) {
      if (paused) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [current, paused]);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/content/hero", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.slides) && data.slides.length) {
          const apiSlides: HeroSlideItem[] = data.slides.map(
            (s: { src: string; alt: string; type?: "video" | "image"; poster?: string }, i: number) => ({
              id: `hero-${i}`,
              type: s.type || (s.src?.endsWith(".mp4") ? "video" : "image"),
              src: s.src,
              poster: s.poster,
              alt: s.alt,
            })
          );
          const hasVideo = apiSlides.some((s) => s.type === "video");
          const finalSlides = hasVideo ? apiSlides : [defaultSlides[0], ...apiSlides];
          setSlides(finalSlides);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reduced || interacting) return;
    // Allow the 8-second video to fully play out when on slide 0
    const delay = current === 0 ? 8500 : 6000;
    const timer = window.setInterval(() => {
      if (!document.hidden) setCurrent((index) => (index + 1) % slides.length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [paused, reduced, interacting, slides.length, current]);

  function select(index: number) {
    setCurrent((index + slides.length) % slides.length);
  }

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      video.volume = 0.8;
      video.play().catch(() => {});
    }
  };

  return (
    <div
      className={`hero-slideshow ${paused || reduced || interacting ? "is-paused" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="HIMATU anime visual and product photography"
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}
    >
      {slides.map((asset, index) => (
        <div
          key={asset.id}
          className={`hero-photo-slide ${index === current ? "is-active" : ""}`}
          aria-hidden={index !== current}
        >
          {asset.type === "video" ? (
            <video
              ref={videoRef}
              src={asset.src}
              poster={asset.poster}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              preload="auto"
              className="hero-video-element"
            />
          ) : (
            <Image
              unoptimized={asset.src?.startsWith("https://")}
              src={asset.src!}
              alt={asset.alt}
              fill
              sizes="100vw"
              preload={index === 0}
              loading={index === 1 ? "eager" : "lazy"}
            />
          )}
        </div>
      ))}
      <div className="hero-photo-shade" />
      <div className="hero-slide-controls">
        <span className="hero-slide-count" aria-live={paused ? "polite" : "off"}>
          0{current + 1}
          <span> / 0{slides.length}</span>
        </span>
        <button
          type="button"
          aria-label="Previous hero visual"
          onClick={() => select(current - 1)}
        >
          <ArrowLeft size={17} />
        </button>
        <button
          type="button"
          aria-label="Next hero visual"
          onClick={() => select(current + 1)}
        >
          <ArrowRight size={17} />
        </button>
        {!reduced && (
          <button
            type="button"
            aria-label={paused ? "Play hero slideshow" : "Pause hero slideshow"}
            onClick={() => {
              setPaused(!paused);
              if (paused) setInteracting(false);
            }}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        )}
        {current === 0 && slides[0].type === "video" && (
          <button
            type="button"
            aria-label={isMuted ? "Unmute anime audio" : "Mute anime audio"}
            onClick={toggleSound}
            title={isMuted ? "Sound On" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}
