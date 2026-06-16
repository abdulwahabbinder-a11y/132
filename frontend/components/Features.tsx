import {
  Brain,
  Clapperboard,
  Globe,
  Mic,
  Scan,
  Wand2,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Script Engine",
    description:
      "Llama 3.1 and Qwen 2.5 generate chronological documentary scripts with scene metadata, character flags, and map coordinates.",
  },
  {
    icon: Globe,
    title: "Public Data Scraping",
    description:
      "Automatic asset fetching from Wikipedia, Wikimedia Commons, Internet Archive, Pexels, and Pixabay for verifiable, real-world footage.",
  },
  {
    icon: Scan,
    title: "Character Cinematics",
    description:
      "DeepVideo-V1 and LivePortrait deliver lip-synced historical characters with neural rendering, micro-expressions, and temporal consistency.",
  },
  {
    icon: Mic,
    title: "ElevenLabs Narration",
    description:
      "Professional voice synthesis with character-level word timestamps for precise subtitle burn-in and audio ducking.",
  },
  {
    icon: Clapperboard,
    title: "Remotion Assembly",
    description:
      "Remotion.dev orchestrates scene clips, Motion.dev transitions, animated Mapbox maps, and FFmpeg post-processing into 21:9 MP4.",
  },
  {
    icon: Wand2,
    title: "Flux & Wan2.1 Animation",
    description:
      "Abstract scenes get photorealistic Flux images animated into 4-second cinematic clips via AnyFlow-Wan2.1-T2V-14B.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
            Features
          </p>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything You Need to Go Viral
          </h2>
          <p className="mx-auto max-w-2xl text-white/50">
            From live web research to final MP4 — every step automated with production-grade AI.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-violet-500/30 hover:bg-white/[0.05]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 transition group-hover:bg-violet-500/25">
                <feature.icon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
