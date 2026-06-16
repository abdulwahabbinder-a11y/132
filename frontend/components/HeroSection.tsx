"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Sparkles, ArrowRight, Zap } from "lucide-react";

const TECH_BADGES = [
  "Llama 3.1 + Qwen 2.5",
  "ElevenLabs TTS",
  "Wan2.1 Animation",
  "DeepVideo-V1",
  "Remotion Assembly",
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-800/5 rounded-full blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center pt-28 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm mb-8"
        >
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="text-gray-300">Vox × BBC × Mighty Monk — powered by AI</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-display font-bold leading-[1.05] mb-6"
        >
          <span className="text-white">Turn Any Topic Into a</span>
          <br />
          <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Cinematic Documentary
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          DocuAI automates the full production pipeline — script writing, archival media sourcing,
          voice synthesis, character lip-sync, and 21:9 cinematic assembly. Press generate,
          get a broadcast-quality documentary.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 animate-pulse-glow">
            <Zap className="w-5 h-5" />
            Start for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="btn-secondary text-lg px-8 py-4 flex items-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            Watch Demo
          </button>
        </motion.div>

        {/* Tech stack badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-xs text-gray-500 mr-2">Powered by:</span>
          {TECH_BADGES.map((badge) => (
            <span
              key={badge}
              className="badge bg-surface-card border border-surface-border text-gray-400 text-xs"
            >
              {badge}
            </span>
          ))}
        </motion.div>

        {/* Cinematic video preview frame */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative mt-20 max-w-5xl mx-auto"
        >
          <div className="glass-card overflow-hidden shadow-glow-lg">
            <div className="bg-surface-border/20 px-4 py-2.5 flex items-center gap-2 border-b border-surface-border">
              <div className="flex gap-1.5">
                {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
                  <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-2 font-mono">The Rise of Artificial Intelligence — 8 scenes · 4K 21:9</span>
            </div>
            {/* Cinematic placeholder with aspect ratio 21:9 */}
            <div className="relative bg-black" style={{ aspectRatio: "21/9" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-black to-purple-950 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-brand-600/20 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                    <Play className="w-8 h-8 text-brand-400 fill-current ml-1" />
                  </div>
                  <p className="text-gray-400 text-sm">Preview: AI-generated documentary</p>
                  <p className="text-gray-600 text-xs mt-1">21:9 · 4K · With subtitles</p>
                </div>
              </div>
              {/* Subtitle bar overlay */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-white text-sm font-medium drop-shadow-lg px-3 py-1 bg-black/40 rounded-lg">
                  In the beginning, there was data — vast, unstructured, and full of possibility.
                </span>
              </div>
            </div>
          </div>
          {/* Floating stats */}
          <div className="absolute -right-4 top-8 glass-card px-4 py-3 rounded-xl shadow-card hidden md:block">
            <div className="text-2xl font-bold text-brand-400">2min</div>
            <div className="text-xs text-gray-400">Avg. gen time</div>
          </div>
          <div className="absolute -left-4 bottom-8 glass-card px-4 py-3 rounded-xl shadow-card hidden md:block">
            <div className="text-2xl font-bold text-green-400">4K</div>
            <div className="text-xs text-gray-400">21:9 output</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
