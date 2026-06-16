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
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            End-to-End Documentary Pipeline
          </h2>
          <p className="mx-auto max-w-2xl text-white/60">
            From topic to finished cinematic video — every step automated with
            production-grade AI and real public data sources.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="card group transition hover:border-brand-500/30">
              <feature.icon className="mb-4 h-8 w-8 text-brand-500 transition group-hover:scale-110" />
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
