"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Enter Your Topic",
    description: "Type any documentary topic — historical events, science, geopolitics, philosophy. Choose language and style.",
    detail: "English · Hindi · Urdu · Roman",
    color: "from-brand-600 to-brand-800",
  },
  {
    step: "02",
    title: "AI Writes the Script",
    description: "Llama 3.1 or Qwen 2.5 generates a strict chronological JSON script with narration, visual keywords, and location coordinates per scene.",
    detail: "5–15 scenes · Chronological arc · Factual grounding",
    color: "from-purple-600 to-brand-700",
  },
  {
    step: "03",
    title: "Media Pipeline Executes",
    description: "Background worker scrapes Wikipedia, Wikimedia Commons, Pexels, and Pixabay. Generates Flux AI art for abstract scenes.",
    detail: "Wikipedia · Wikimedia · Archive.org · Pexels · Pixabay",
    color: "from-cyan-600 to-purple-700",
  },
  {
    step: "04",
    title: "Voice & Animation",
    description: "ElevenLabs synthesizes narration with word timestamps. Wan2.1 animates stills. LivePortrait + DeepVideo-V1 renders historical characters.",
    detail: "ElevenLabs · Wan2.1 · LivePortrait · DeepVideo-V1",
    color: "from-green-600 to-cyan-700",
  },
  {
    step: "05",
    title: "Remotion Assembly",
    description: "Remotion orchestrates all clips, adds Motion.dev transitions, renders geopolitical maps, and burns word-synced subtitles.",
    detail: "Remotion · Motion.dev · Mapbox · SRT subtitles",
    color: "from-orange-600 to-red-700",
  },
  {
    step: "06",
    title: "FFmpeg Final Render",
    description: "Audio ducking applied, transition SFX inserted, final render exported as 4K 21:9 cinematic MP4.",
    detail: "4K · 21:9 · H.264 · Audio ducked · SFX",
    color: "from-pink-600 to-orange-700",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 px-4 bg-surface-card/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge bg-purple-600/20 text-purple-400 mb-4">End-to-End Pipeline</span>
          <h2 className="section-title mb-4">From Topic to Masterpiece in 6 Steps</h2>
          <p className="section-subtitle">
            A fully automated production pipeline that rivals human documentary teams.
          </p>
        </motion.div>

        <div className="relative">
          {STEPS.map((step, i) => (
            <div key={step.step}>
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 hover:border-brand-700 transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center font-display font-bold text-lg shadow-glow-sm`}>
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-xl mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">{step.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.detail.split(" · ").map((tag) => (
                        <span key={tag} className="badge bg-surface border border-surface-border text-gray-500 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {i < STEPS.length - 1 && (
                <div className="flex justify-center py-3">
                  <ArrowDown className="w-5 h-5 text-brand-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
