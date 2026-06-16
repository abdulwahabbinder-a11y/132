"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Globe2,
  Image as ImageIcon,
  Mic,
  Film,
  Map,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Smart scripting router",
    body: "Llama 3.1 for English, Qwen 2.5 for Hindi, Urdu & Roman scripts — strict chronological JSON with scene metadata.",
  },
  {
    icon: Globe2,
    title: "Automatic web research",
    body: "Grounds every story in verifiable Wikipedia / Wikidata facts before a single frame is rendered.",
  },
  {
    icon: ImageIcon,
    title: "Multi-source media",
    body: "Archival photos from Wikimedia & Internet Archive, B-roll from Pexels & Pixabay, and Flux AI art for abstract scenes.",
  },
  {
    icon: Mic,
    title: "Premium narration",
    body: "ElevenLabs voice with character-level timestamps for perfectly synced burn-in subtitles.",
  },
  {
    icon: Film,
    title: "Character cinematics",
    body: "LivePortrait lip-sync piped through DeepVideo-V1 for flicker-free, expressive historical characters.",
  },
  {
    icon: Map,
    title: "Animated geopolitics",
    body: "Mapbox-powered map sequences driven by each scene's coordinates, composed in Remotion.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white">An entire studio, automated</h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/60">
          Six AI subsystems work together so you go from a single topic to a
          finished cinematic documentary.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="card p-6"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
              <f.icon size={22} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
