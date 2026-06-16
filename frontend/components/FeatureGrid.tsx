"use client";

import { motion } from "framer-motion";
import { Brain, Globe2, Image as ImageIcon, Layers, MapPinned, MicVocal } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Llama 3.1 & Qwen 2.5",
    body: "Strict JSON scripts via NVIDIA NIM — English on Llama 3.1, Hindi / Urdu / Roman on Qwen 2.5.",
  },
  {
    icon: Globe2,
    title: "Public-web archives",
    body: "Wikipedia, Wikidata, Wikimedia Commons, and Internet Archive feed verifiable timeline footage.",
  },
  {
    icon: ImageIcon,
    title: "Flux 1-dev abstracts",
    body: "Concept scenes you can't photograph are rendered with stabilityai/flux-1-dev on NIM.",
  },
  {
    icon: MicVocal,
    title: "ElevenLabs narration",
    body: "Per-character timestamps drive burn-in subtitles and audio-ducked music with FFmpeg.",
  },
  {
    icon: Layers,
    title: "DeepVideo-V1 cinematics",
    body: "LivePortrait + DeepVideo-V1 pipeline yields flicker-free, identity-preserving character rendering.",
  },
  {
    icon: MapPinned,
    title: "Geopolitical maps",
    body: "Mapbox-driven sequences animate location_coordinates in sync with the narration.",
  },
];

export function FeatureGrid() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center">
          The full documentary pipeline
        </h2>
        <p className="mt-3 text-center text-white/60 max-w-2xl mx-auto">
          Every stage — scripting, scraping, voice, character cinematics, assembly — runs as a managed worker.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="glass rounded-xl p-6"
            >
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/65">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
