"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-pattern pt-20">
      <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-500">
            <Sparkles className="h-4 w-4" />
            AI-Powered Documentary Studio
          </span>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Premium Documentary Videos,{" "}
            <span className="bg-gradient-to-r from-brand-500 to-orange-400 bg-clip-text text-transparent">
              Fully Automated
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 md:text-xl">
            Generate Vox and Mighty Monk style documentaries with AI scripting,
            real archival footage, character cinematics, and cinematic 21:9 renders.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/create" className="btn-primary gap-2 text-base">
              <Play className="h-5 w-5" />
              Start Creating
            </Link>
            <Link href="#pricing" className="btn-secondary text-base">
              View Pricing
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 aspect-[21/9] overflow-hidden rounded-2xl border border-white/10 bg-surface-900 shadow-2xl"
        >
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-surface-800 to-surface-950">
            <div className="text-center">
              <Play className="mx-auto mb-4 h-16 w-16 text-brand-500 opacity-60" />
              <p className="text-sm text-white/40">21:9 Cinematic Preview</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
