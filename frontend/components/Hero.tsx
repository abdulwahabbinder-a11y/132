"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play, Sparkles, Globe, Video, ArrowRight, CheckCircle2,
  Clock, Shield, Zap,
} from "lucide-react";

const stats = [
  { value: "10+", label: "Live Data Sources", detail: "Tavily, Jina, Serper, Exa & more" },
  { value: "50K", label: "Chars Researched", detail: "Per video generation job" },
  { value: "2", label: "Output Formats", detail: "9:16 viral + 21:9 cinematic" },
  { value: "~45m", label: "Avg. Production", detail: "Topic to finished MP4" },
];

const trust = [
  { icon: Shield, text: "SOC2-ready infrastructure" },
  { icon: Zap, text: "Claude + Llama dual AI" },
  { icon: Clock, text: "3 free credits on signup" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[#050508]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_80%,rgba(217,70,239,0.06),transparent)]" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-20">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
              </span>
              <span className="text-xs font-semibold text-violet-300">
                AI Video Production Platform · Now in Public Beta
              </span>
            </div>

            <h1 className="font-display mb-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Turn Any Topic Into a{" "}
              <span className="gradient-text">Studio-Quality Video</span>
            </h1>

            <p className="mb-6 max-w-lg text-base leading-relaxed text-white/55 lg:text-[1.05rem]">
              DocuForge AI scrapes live data from 10+ sources, synthesizes research with
              Claude, writes scripts with Llama 3.1, generates voice with ElevenLabs,
              creates visuals with Flux, and renders cinematic MP4s — zero editing required.
            </p>

            <ul className="mb-8 space-y-2.5">
              {[
                "Viral 9:16 shorts for TikTok, Reels & YouTube Shorts",
                "21:9 cinematic documentaries in Vox & BBC style",
                "Burned-in subtitles with word-level timestamps",
                "Admin dashboard to control all API keys & scrapers",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/60">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mb-8 flex flex-wrap gap-3">
              {trust.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/50">
                  <Icon className="h-3.5 w-3.5 text-violet-400" />
                  {text}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/create" className="btn-primary px-8 py-3.5 text-base">
                <Play className="h-4 w-4" />
                Start Free — 3 Credits
              </Link>
              <Link href="#pipeline" className="btn-secondary px-8 py-3.5 text-base">
                Explore Pipeline
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/30">No credit card required · Cancel anytime</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a0f] shadow-2xl shadow-violet-900/20">
              <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="ml-2 flex-1 rounded-md bg-white/5 px-3 py-1 text-center text-[10px] text-white/30">
                  app.docuforge.ai/create
                </span>
              </div>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold text-violet-400">● Generating Video</p>
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">Viral Short · 60s</span>
                </div>
                <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Topic</p>
                  <p className="mt-1 text-sm text-white/75">&ldquo;Why Japan&apos;s population is collapsing — and what it means for the world&rdquo;</p>
                </div>
                <div className="mb-4 space-y-1.5">
                  {[
                    { icon: Globe, label: "Research", sub: "Tavily · Jina · Serper · Exa · Wikipedia — 8/10 sources", pct: 100, done: true },
                    { icon: Sparkles, label: "Claude Brief", sub: "14 key facts · 3 hook angles · timeline built", pct: 100, done: true },
                    { icon: Sparkles, label: "Script", sub: "Llama 3.1 — 12 scenes · 58 sec total", pct: 100, done: true },
                    { icon: Video, label: "Assets + Render", sub: "Flux images · ElevenLabs · Remotion 9:16", pct: 62, done: false },
                  ].map(({ icon: Icon, label, sub, pct, done }) => (
                    <div key={label} className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${done ? "bg-violet-500/20" : "bg-white/5"}`}>
                        <Icon className={`h-3.5 w-3.5 ${done ? "text-violet-400" : "text-white/30"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{label}</p>
                          {done && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        </div>
                        <p className="truncate text-[10px] text-white/35">{sub}</p>
                        {!done && (
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-violet-500/10 px-3 py-2">
                  <span className="text-xs text-violet-300">Overall progress</span>
                  <span className="text-xs font-bold text-violet-300">78%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-20 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ value, label, detail }) => (
            <div key={label} className="glass-card px-6 py-5 text-center">
              <p className="font-display text-3xl font-bold gradient-text">{value}</p>
              <p className="mt-1 text-sm font-medium text-white/70">{label}</p>
              <p className="mt-0.5 text-[10px] text-white/35">{detail}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
