"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function EditorialSection() {
  return (
    <section className="section-editorial" aria-label="Editorial Brand Campaign">
      <div className="editorial-bg">
        <Image
          src="/images/figures/869689144_122155861029356138_6211747126010481950_n.jpg"
          alt="HIMATU Collector's showcase editorial background"
          fill
          priority={false}
          quality={85}
        />
      </div>

      <div className="editorial-scrim" />

      <motion.div
        className="editorial-content"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="section-eyebrow" style={{ color: "#d8b4fe" }}>
          THE ART OF COLLECTING
        </span>

        <h2 className="editorial-headline">
          MORE THAN A COLLECTION.
          <br />
          <span style={{ color: "var(--cinematic-purple)" }}>IT’S YOUR UNIVERSE.</span>
        </h2>

        <p className="editorial-desc">
          Every figure holds a memory. Every statue marks a chapter. HIMATU curates iconic collectibles designed to be the centerpiece of your space.
        </p>

        <div>
          <Link href="/collections" className="btn-primary-purple">
            <span>EXPLORE THE UNIVERSE</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
