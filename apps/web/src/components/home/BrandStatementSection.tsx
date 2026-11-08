"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export function BrandStatementSection() {
  return (
    <section className="section-brand" aria-label="Brand Philosophy">
      <motion.div
        className="brand-statement-wrap"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="brand-wordmark">HIMATU</div>

        <h2 className="brand-triad">
          <span>DISCOVER.</span>
          <span>COLLECT.</span>
          <span style={{ color: "#a855f7" }}>DISPLAY.</span>
        </h2>

        <p className="brand-desc">
          A destination for anime fans, collectors and creators who appreciate the art of collecting. From Bangladesh, with fandom.
        </p>

        <div style={{ marginTop: "40px" }}>
          <Link
            href="/about"
            className="btn-secondary-purple"
            style={{ display: "inline-flex", gap: "8px" }}
          >
            <span>ABOUT HIMATU</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
