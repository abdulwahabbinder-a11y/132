"use client";

import {
  BrainCircuit,
  Globe2,
  Image as ImageIcon,
  Mic,
  Clapperboard,
  Map,
} from "lucide-react";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Smart scripting router",
    body: "Llama 3.1 70B for English, Qwen 2.5 72B for Hindi/Urdu/Roman — strict chronological scene JSON.",
  },
  {
    icon: Globe2,
    title: "Verifiable web scraping",
    body: "Real facts from Wikipedia & Wikidata; archival media from Wikimedia Commons & the Internet Archive.",
  },
  {
    icon: ImageIcon,
    title: "AI art + B-roll",
    body: "Flux-1-dev photorealistic art for abstract scenes; Pexels & Pixabay stock B-roll for the rest.",
  },
  {
    icon: Mic,
    title: "Studio narration",
    body: "ElevenLabs voiceover with word-level timestamps for perfectly synced burn-in subtitles.",
  },
  {
    icon: Clapperboard,
    title: "Neural character cinematics",
    body: "LivePortrait lip-sync refined by DeepVideo-V1 for flicker-free, temporally consistent characters.",
  },
  {
    icon: Map,
    title: "Animated geopolitics",
    body: "Mapbox fly-to sequences driven by each scene's coordinates, assembled in Remotion + Motion.dev.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="container-x py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="pill">The full pipeline</span>
        <h2 className="mt-4 font-display text-4xl font-bold">
          Everything a documentary needs, automated
        </h2>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6">
            <f.icon className="h-7 w-7 text-brand-400" />
            <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
