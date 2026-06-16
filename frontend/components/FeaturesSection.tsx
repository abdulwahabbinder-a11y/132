"use client";

import { motion } from "framer-motion";
import {
  Brain, Mic2, Film, Globe, Layers, Wand2,
  Map, Subtitles, History, Image
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Dual LLM Scripting",
    description: "Llama 3.1 70B for English. Qwen 2.5 72B for Hindi, Urdu & Roman scripts. Strict chronological JSON output.",
    color: "text-brand-400",
    bg: "bg-brand-400/10",
  },
  {
    icon: Globe,
    title: "Public Data Scraping",
    description: "Automatically fetches verified facts from Wikipedia, archival photos from Wikimedia Commons, and footage from Pexels & Pixabay.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: Image,
    title: "Flux AI Art Generation",
    description: "Abstract and conceptual scenes use stabilityai/flux-1-dev via NVIDIA NIM for photorealistic cinematic imagery.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Mic2,
    title: "ElevenLabs Voice Synthesis",
    description: "Premium TTS with word-level character timestamps for pixel-perfect subtitle burn-in and audio ducking.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: Film,
    title: "Wan2.1 Image Animation",
    description: "Static archival photos transformed into 4-second cinematic motion clips with smooth camera movement via AnyFlow-Wan2.1-T2V-14B.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: History,
    title: "Historical Character Engine",
    description: "LivePortrait lip-sync → DeepVideo-V1 neural rendering for micro-expressions, temporal consistency, and zero flicker.",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  {
    icon: Map,
    title: "Geopolitical Map Sequences",
    description: "Mapbox/Leaflet animated map renders using scene location coordinates, seamlessly integrated into the Remotion timeline.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Wand2,
    title: "Remotion + Motion Assembly",
    description: "Procedural layout transitions, typographic overlays, and smooth animations via Motion.dev inside the Remotion pipeline.",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  {
    icon: Layers,
    title: "FFmpeg Audio Ducking",
    description: "Background music drops 85% during narration. Whoosh/Deep Boom SFX auto-inserted at scene transitions. Outputs 21:9 MP4.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge bg-brand-600/20 text-brand-400 mb-4">Full-Stack AI Pipeline</span>
          <h2 className="section-title mb-4">
            Every Component. Production-Ready.
          </h2>
          <p className="section-subtitle">
            Nine interconnected AI systems working in concert — from raw topic to cinematic 4K output.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-card p-6 hover:border-brand-700 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
