"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Layers, Cpu, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function CustomPrintingSection() {
  return (
    <section className="section-custom-printing" aria-labelledby="printing-heading">
      <div className="custom-printing-container">
        {/* Left Column: Story & 3 Steps */}
        <div>
          <span className="section-eyebrow">
            <Cpu size={14} /> BESPOKE MANUFACTURING
          </span>
          <h2 id="printing-heading" className="section-title">
            YOUR FAVOURITE CHARACTER.
            <br />
            <span style={{ color: "var(--cinematic-purple)" }}>YOUR OWN COLLECTIBLE.</span>
          </h2>
          <p className="hero-description" style={{ marginBottom: "28px" }}>
            Turn your favourite anime character and creative ideas into a custom collectible figure with HIMATU. High-density resin craftsmanship tailored specifically for your collection.
          </p>

          <div className="printing-steps">
            <motion.div
              className="printing-step-card"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="printing-step-num">01</div>
              <div className="printing-step-text">
                <h4>SHARE YOUR IDEA</h4>
                <p>Upload character reference artwork, poses, or ready-to-print 3D models (.STL / .OBJ).</p>
              </div>
            </motion.div>

            <motion.div
              className="printing-step-card"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="printing-step-num">02</div>
              <div className="printing-step-text">
                <h4>APPROVE YOUR DESIGN</h4>
                <p>Receive technical printability review, dimensional scales, finishing options, and fixed quotation.</p>
              </div>
            </motion.div>

            <motion.div
              className="printing-step-card"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="printing-step-num">03</div>
              <div className="printing-step-text">
                <h4>BRING IT TO LIFE</h4>
                <p>Precision SLA UV-cured resin printing, fine hand-sanding, quality inspection, and secured delivery.</p>
              </div>
            </motion.div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
            <Link href="/3d-printing" className="btn-primary-purple">
              <span>EXPLORE CUSTOM PRINTING</span>
              <ArrowRight size={16} />
            </Link>
            <span style={{ fontSize: "11px", color: "var(--cinematic-muted)", letterSpacing: "0.04em" }}>
              *Subject to structural feasibility review and manufacturing scale guidelines.
            </span>
          </div>
        </div>

        {/* Right Column: Visual Stage */}
        <motion.div
          className="printing-visual-stage"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/images/figures/869689144_122155861029356138_6211747126010481950_n.jpg"
            alt="Studio close-up of intricate 3D collectible sculpture at HIMATU"
            fill
            className="printing-visual-img"
            quality={90}
          />
          <div className="printing-spec-tag">
            <span className="spec-dot" />
            <div>
              <strong style={{ display: "block", fontSize: "13px", color: "#ffffff", letterSpacing: "0.04em" }}>
                PRECISION SLA UV-RESIN
              </strong>
              <small style={{ fontSize: "11px", color: "var(--cinematic-muted)" }}>
                0.05mm layer resolution · Hand-cured finish
              </small>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
