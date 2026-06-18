import {
  Brain, Globe, Scan, Mic, Clapperboard, Wand2,
  Subtitles, Map, Shield, Layers,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "10+ Live Data Scrapers",
    description: "Parallel web research from Tavily, Jina AI, Serper, Firecrawl, Exa, Brave Search, NewsAPI, Google CSE, Wikipedia, and Internet Archive.",
    bullets: ["Up to 50,000 chars per job", "Admin toggle per source", "Automatic failover"],
  },
  {
    icon: Brain,
    title: "Dual AI Script Engine",
    description: "Claude Sonnet synthesizes research briefs. Llama 3.1 70B (English) and Qwen 2.5 72B (Hindi/Urdu) write scene-by-scene viral scripts.",
    bullets: ["Research brief with key facts", "Hook angle identification", "Chronological scene JSON"],
  },
  {
    icon: Mic,
    title: "ElevenLabs Pro Narration",
    description: "Multilingual v2 voice model with character-level word timestamps. Enables precise subtitle burn-in and audio ducking during narration.",
    bullets: ["29+ languages", "Word-level timestamps", "Custom voice ID support"],
  },
  {
    icon: Wand2,
    title: "Flux AI Visual Generation",
    description: "Photorealistic 1080×1920 vertical images for abstract scenes. Wan2.1 animates static images into 4-second cinematic motion clips.",
    bullets: ["NVIDIA NIM Flux 1-dev", "Vertical-optimized prompts", "Ken Burns + motion"],
  },
  {
    icon: Scan,
    title: "Character Cinematics",
    description: "LivePortrait delivers precise lip-sync for historical figures. DeepVideo-V1 adds micro-expressions, temporal consistency, and anti-flicker rendering.",
    bullets: ["LivePortrait lip-sync", "DeepVideo-V1 enhancement", "1080p neural rendering"],
  },
  {
    icon: Clapperboard,
    title: "Remotion Video Assembly",
    description: "Remotion.dev orchestrates scene clips with Motion.dev spring transitions. Animated Mapbox map sequences from script coordinates.",
    bullets: ["Procedural transitions", "Geopolitical map overlays", "Multi-layer timeline"],
  },
  {
    icon: Subtitles,
    title: "Auto Subtitle Burn-In",
    description: "FFmpeg processes ElevenLabs word timestamps into center-bottom aligned SRT subtitles, burned directly into the final MP4 export.",
    bullets: ["Word-level sync", "Center-bottom alignment", "Karaoke-style highlight"],
  },
  {
    icon: Map,
    title: "Animated Map Sequences",
    description: "Mapbox and OpenStreetMap integration renders dynamic zoom animations for geopolitical and historical documentary sequences.",
    bullets: ["Lat/lng from script JSON", "Animated zoom transitions", "Location label overlays"],
  },
  {
    icon: Shield,
    title: "Admin API Control",
    description: "Supabase-powered settings table stores all API keys. Admin dashboard with scraper status grid, enable toggles, and 60-second cache refresh.",
    bullets: ["Dynamic key management", "Per-scraper toggles", "No redeploy needed"],
  },
];

export function Features() {
  return (
    <section id="features" className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="section-label">Platform Features</p>
          <h2 className="section-title mb-4">Everything in One Production Pipeline</h2>
          <p className="section-subtitle">
            Nine integrated capabilities that replace an entire video production team —
            researchers, scriptwriters, voice actors, graphic designers, and editors.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, bullets }) => (
            <div key={title} className="glass-card-hover group p-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/5 ring-1 ring-violet-500/15 transition group-hover:ring-violet-500/30">
                <Icon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="mb-2 font-display text-base font-semibold">{title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-white/45">{description}</p>
              <ul className="space-y-1.5 border-t border-white/[0.06] pt-4">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-white/35">
                    <Layers className="h-3 w-3 shrink-0 text-violet-500/50" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
