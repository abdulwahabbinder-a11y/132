import {
  Search,
  Brain,
  Mic,
  Image,
  Film,
  Database,
} from "lucide-react";

const pipeline = [
  {
    phase: "01 — Research",
    icon: Search,
    title: "Multi-Source Live Scraping",
    color: "from-blue-500/20 to-cyan-500/10",
    iconColor: "text-cyan-400",
    tools: ["Tavily", "Jina AI", "Serper", "Firecrawl", "Exa", "Brave", "NewsAPI", "Wikipedia", "Internet Archive"],
    details:
      "10 scrapers run in parallel, collecting up to 50,000 characters of live research. Admin dashboard lets you enable/disable each source and configure API keys independently.",
  },
  {
    phase: "02 — Intelligence",
    icon: Brain,
    title: "Claude + Llama Script Engine",
    color: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    tools: ["Claude Sonnet", "Llama 3.1 70B", "Qwen 2.5 72B"],
    details:
      "Claude AI synthesizes all scraped data into a research brief with key facts, hook angles, and timeline. Llama or Claude then writes scene-by-scene scripts with image prompts, narration, and map coordinates.",
  },
  {
    phase: "03 — Voice",
    icon: Mic,
    title: "ElevenLabs Narration",
    color: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
    tools: ["ElevenLabs Multilingual v2", "Word-level timestamps"],
    details:
      "Professional AI voice synthesis with character-level word timestamps for precise subtitle burn-in. Supports 29+ languages. Audio ducking drops background music 85% during narration.",
  },
  {
    phase: "04 — Visuals",
    icon: Image,
    title: "Flux + Stock Media",
    color: "from-rose-500/20 to-pink-500/10",
    iconColor: "text-rose-400",
    tools: ["Flux 1-dev", "Pexels", "Pixabay", "Wikimedia", "Wan2.1 T2V"],
    details:
      "Abstract scenes get photorealistic Flux images (1080×1920 vertical). Real topics pull archival photos from Wikimedia and Internet Archive. B-roll from Pexels/Pixabay. Static images animated via Wan2.1.",
  },
  {
    phase: "05 — Characters",
    icon: Database,
    title: "DeepVideo Character Engine",
    color: "from-emerald-500/20 to-green-500/10",
    iconColor: "text-emerald-400",
    tools: ["LivePortrait", "DeepVideo-V1", "Neural rendering"],
    details:
      "Historical character scenes use LivePortrait for lip-sync, then DeepVideo-V1 for micro-expressions, temporal consistency, and anti-flicker neural rendering at 1080p fidelity.",
  },
  {
    phase: "06 — Assembly",
    icon: Film,
    title: "Remotion + FFmpeg Render",
    color: "from-fuchsia-500/20 to-violet-500/10",
    iconColor: "text-fuchsia-400",
    tools: ["Remotion.dev", "Motion.dev", "FFmpeg", "Mapbox maps"],
    details:
      "Remotion orchestrates scene clips with spring transitions. Animated geopolitical maps from coordinates. FFmpeg burns center-bottom subtitles, inserts whoosh/boom SFX, and exports 9:16 or 21:9 MP4.",
  },
];

export function TechPipeline() {
  return (
    <section id="pipeline" className="border-y border-white/[0.06] bg-white/[0.015] py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="section-label">Technology</p>
          <h2 className="section-title mb-4">6-Phase Production Pipeline</h2>
          <p className="section-subtitle">
            Every video passes through research, intelligence, voice, visuals, character
            rendering, and final assembly — fully automated, production-grade output.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pipeline.map(({ phase, icon: Icon, title, color, iconColor, tools, details }) => (
            <div key={phase} className={`glass-card overflow-hidden bg-gradient-to-br ${color}`}>
              <div className="p-6">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                  {phase}
                </p>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/20">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <h3 className="font-display font-semibold">{title}</h3>
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/55">{details}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-medium text-white/50"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
