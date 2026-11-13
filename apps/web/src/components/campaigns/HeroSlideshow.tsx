"use client";

import Image from "next/image";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface HeroMediaItem {
  id?: string;
  type: "video" | "image";
  src: string;
  poster?: string;
  alt: string;
}

const defaultMedia: HeroMediaItem = {
  id: "hero-video-one-piece",
  type: "video",
  src: "/videos/hero-anime.mp4",
  poster: "/videos/hero-anime-poster.jpg",
  alt: "HIMATU One Piece Anime Horizontal Cinematic Visual",
};

export function HeroSlideshow() {
  const [media, setMedia] = useState<HeroMediaItem>(defaultMedia);
  const [paused, setPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [reduced, setReduced] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync play/pause with user action
  useEffect(() => {
    const video = videoRef.current;
    if (!video || media.type !== "video") return;

    if (paused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [paused, media.type]);

  // Fetch admin configured hero media if set
  useEffect(() => {
    let active = true;
    fetch("/api/v1/content/hero", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data.media && data.media.src) {
          setMedia({
            id: "hero-admin-media",
            type: data.media.type || (data.media.src.endsWith(".mp4") ? "video" : "image"),
            src: data.media.src,
            poster: data.media.poster || "/videos/hero-anime-poster.jpg",
            alt: data.media.alt || "HIMATU Anime Hero Visual",
          });
        } else if (Array.isArray(data.slides) && data.slides.length) {
          // Backward compatibility with legacy slide arrays: pick first item
          const first = data.slides[0];
          setMedia({
            id: "hero-slide-0",
            type: first.type || (first.src?.endsWith(".mp4") ? "video" : "image"),
            src: first.src,
            poster: first.poster || "/videos/hero-anime-poster.jpg",
            alt: first.alt || "HIMATU Anime Hero Visual",
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      video.volume = 0.85;
      video.play().catch(() => {});
    }
  };

  return (
    <div
      className="hero-slideshow"
      role="region"
      aria-label="HIMATU anime visual showcase"
    >
      <div className="hero-photo-slide is-active" aria-hidden="false">
        {media.type === "video" ? (
          <video
            ref={videoRef}
            src={media.src}
            poster={media.poster}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            className="hero-video-element"
          />
        ) : (
          <Image
            unoptimized={media.src?.startsWith("https://")}
            src={media.src}
            alt={media.alt}
            fill
            sizes="100vw"
            priority
            loading="eager"
          />
        )}
      </div>

      <div className="hero-photo-shade" />

      {/* Hero media controls: Sound and Play/Pause */}
      <div className="hero-slide-controls">
        {media.type === "video" && (
          <button
            type="button"
            className="hero-media-btn"
            aria-label={isMuted ? "Unmute anime audio" : "Mute anime audio"}
            onClick={toggleSound}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}

        {media.type === "video" && !reduced && (
          <button
            type="button"
            className="hero-media-btn"
            aria-label={paused ? "Play anime video" : "Pause anime video"}
            onClick={() => setPaused(!paused)}
            title={paused ? "Play Video" : "Pause Video"}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
