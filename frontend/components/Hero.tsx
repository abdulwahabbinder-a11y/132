"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="container-x relative overflow-hidden pb-10 pt-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="pill">
          <Sparkles className="h-3.5 w-3.5 text-gold" /> AI Documentary Studio
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-extrabold leading-tight sm:text-6xl">
          Turn any topic into a{" "}
          <span className="gradient-text">cinematic documentary</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
          DocuForge AI scripts, sources real archival footage, narrates, animates,
          and renders premium high-retention videos in the style of Vox and
          Mighty Monk — fully automated, end to end.
        </p>
        <div className="mt-9 flex items-center justify-center gap-4">
          <Link href="/dashboard" className="btn-primary">
            <Play className="h-4 w-4" /> Generate a documentary
          </Link>
          <Link href="/pricing" className="btn-ghost">
            View pricing
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="card mx-auto mt-16 aspect-[21/9] max-w-4xl overflow-hidden"
      >
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20">
              <Play className="h-7 w-7 text-brand-400" />
            </div>
            <p className="mt-4 text-sm text-slate-400">
              21:9 cinematic preview · subtitles · animated maps · audio ducking
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
