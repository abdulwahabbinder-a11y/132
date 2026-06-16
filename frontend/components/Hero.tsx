"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  Sparkles,
  Zap,
  Globe,
  Video,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const stats = [
  { value: "10+", label: "Data Sources" },
  { value: "9:16", label: "Viral Shorts" },
  { value: "21:9", label: "Cinematic" },
  { value: "60s", label: "Avg. Generation" },
];

const trust = ["Claude AI Research", "ElevenLabs Voice", "Flux Images", "Remotion Render"];

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[#06060a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.18),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(230,57,70,0.08),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI Video Production Platform
            </span>

            <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Turn Any Topic Into a{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-brand-500 bg-clip-text text-transparent">
                Viral Video
              </span>
            </h1>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-white/55 lg:text-lg">
              DocuForge AI researches live web data, writes scripts with Claude &amp; Llama,
              generates voice + visuals, and renders cinematic videos — fully automated.
            </p>

            <div className="mb-8 flex flex-wrap gap-2">
              {trust.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                >
                  <CheckCircle2 className="h-3 w-3 text-violet-400" />
                  {t}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
              >
                <Play className="h-4 w-4" />
                Start Creating Free
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See How It Works
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Right — preview card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12] shadow-2xl">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-white/30">docuforge.ai/create</span>
              </div>

              {/* Preview content */}
              <div className="p-6">
                <p className="mb-3 text-xs font-medium text-violet-400">Generating video...</p>
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/70">
                    &ldquo;Why Japan&apos;s population is shrinking faster than any nation on
                    earth...&rdquo;
                  </p>
                </div>

                <div className="mb-4 space-y-2">
                  {[
                    { icon: Globe, label: "Research", status: "10 sources scraped", done: true },
                    { icon: Sparkles, label: "Script", status: "Claude AI — 12 scenes", done: true },
                    { icon: Zap, label: "Assets", status: "Flux + ElevenLabs", done: false },
                    { icon: Video, label: "Render", status: "Remotion 9:16", done: false },
                  ].map(({ icon: Icon, label, status, done }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          done ? "bg-violet-500/20" : "bg-white/5"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${done ? "text-violet-400" : "text-white/30"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{label}</p>
                        <p className="text-[10px] text-white/40">{status}</p>
                      </div>
                      {done && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </div>
                  ))}
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[58%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                </div>
                <p className="mt-1.5 text-right text-[10px] text-white/30">58% complete</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-6 py-5 text-center"
            >
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
