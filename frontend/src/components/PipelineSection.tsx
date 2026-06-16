"use client";

import { motion } from "framer-motion";

const STEPS = [
  { n: "01", title: "Script", body: "NIM LLM router writes a chronological scene plan." },
  { n: "02", title: "Research", body: "Wikipedia / Wikidata verifiable fact grounding." },
  { n: "03", title: "Gather", body: "Wikimedia, Internet Archive, Pexels, Pixabay, Flux." },
  { n: "04", title: "Voice", body: "ElevenLabs narration with word-level timestamps." },
  { n: "05", title: "Animate", body: "Wan2.1 motion · LivePortrait · DeepVideo-V1." },
  { n: "06", title: "Render", body: "Remotion + Motion.dev + FFmpeg → 21:9 MP4." },
];

export function PipelineSection() {
  return (
    <section id="pipeline" className="border-y border-white/10 bg-ink-900/40">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white">The generation pipeline</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/60">
            Every render runs as an asynchronous background job — you can close
            the tab and come back to a finished film.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="card p-5"
            >
              <span className="text-2xl font-black text-brand-500/40">{step.n}</span>
              <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/55">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
