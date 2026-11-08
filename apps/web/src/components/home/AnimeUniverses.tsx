"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const ANIME_UNIVERSES = [
  {
    name: "One Piece",
    slug: "one-piece",
    count: "8 Collectibles",
    image: "/images/figures/862314978_122155859979356138_1917160491667365230_n.jpg",
    accent: "#a855f7",
  },
  {
    name: "Naruto",
    slug: "naruto",
    count: "6 Collectibles",
    image: "/images/figures/867463200_122155860927356138_2040773041185832800_n.jpg",
    accent: "#f59e0b",
  },
  {
    name: "Dragon Ball",
    slug: "dragon-ball",
    count: "5 Collectibles",
    image: "/images/figures/869689144_122155861029356138_6211747126010481950_n.jpg",
    accent: "#ef4444",
  },
  {
    name: "Jujutsu Kaisen",
    slug: "jujutsu-kaisen",
    count: "6 Collectibles",
    image: "/images/figures/876048683_122155861521356138_4631002917188527144_n.jpg",
    accent: "#3b82f6",
  },
  {
    name: "Demon Slayer",
    slug: "demon-slayer",
    count: "5 Collectibles",
    image: "/images/figures/867640567_122155861473356138_4650069518476672319_n.jpg",
    accent: "#10b981",
  },
];

export function AnimeUniverses() {
  return (
    <section className="section-universe" aria-labelledby="universe-heading">
      <div className="section-header-center">
        <span className="section-eyebrow">CURATED WORLDS & FRANCHISES</span>
        <h2 id="universe-heading" className="section-title">
          EXPLORE YOUR UNIVERSE.
        </h2>
        <p className="section-subtitle">
          Step into authentic anime worlds. High-grade sculpted figures capturing the defining moments of your favourite characters.
        </p>
      </div>

      <div className="universe-grid">
        {ANIME_UNIVERSES.map((universe, index) => (
          <motion.div
            key={universe.slug}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href={`/collections/${universe.slug}`} className="universe-card">
              <div className="universe-card-bg">
                <Image
                  src={universe.image}
                  alt={`${universe.name} figures at HIMATU`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
                  quality={85}
                />
              </div>

              <div className="universe-card-overlay" />

              <div className="universe-card-content">
                <span className="universe-tag">{universe.count}</span>
                <h3 className="universe-name">{universe.name}</h3>
                <span className="universe-cta">
                  <span>Explore Universe</span>
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
