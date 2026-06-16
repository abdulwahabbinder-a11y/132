"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="bg-hero-grid">
      <div className="mx-auto max-w-7xl px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-brand-400"
        >
          <Sparkles size={14} /> DeepVideo-V1 · Remotion · NVIDIA NIM
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl"
        >
          Turn any topic into a{" "}
          <span className="bg-gradient-to-r from-brand-400 to-amberglow bg-clip-text text-transparent">
            cinematic documentary
          </span>
          —automatically.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-white/60"
        >
          DocuForge AI scripts, researches, scrapes archival media, animates
          historical characters, and renders broadcast-ready 21:9 videos in the
          high-retention style of Mighty Monk and Vox.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Link href="/dashboard" className="btn-primary text-base">
            Start creating <ArrowRight size={18} />
          </Link>
          <Link href="/pricing" className="btn-ghost text-base">
            View pricing
          </Link>
        </motion.div>

        <p className="mt-6 text-xs text-white/40">
          Free plan includes 3 documentaries · no credit card required
        </p>
      </div>
    </section>
  );
}
