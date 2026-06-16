"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Mic, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-6 pt-20 pb-32 md:pt-32">
      <div className="mx-auto max-w-6xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/60"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Powered by NVIDIA NIM · Remotion · ElevenLabs
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="mt-8 text-5xl md:text-7xl font-display font-bold tracking-tight"
        >
          Cinematic documentaries,
          <span className="block text-accent">generated on demand.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-white/65"
        >
          DocuGen AI scripts, researches, narrates, and renders 21:9 cinematic
          documentaries in the style of Mighty Monk and Vox — fully automated
          from a single topic.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/dashboard" className="btn-primary">
            <Film className="h-4 w-4 mr-2" /> Generate your first video
          </Link>
          <Link href="#pricing" className="btn-ghost">
            <Mic className="h-4 w-4 mr-2" /> See pricing
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
