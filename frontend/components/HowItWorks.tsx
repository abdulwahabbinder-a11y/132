import { Search, Wand2, FileText, Film } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Describe Your Topic",
    subtitle: "30 seconds",
    description:
      "Type any subject into the Vidrush-style create studio. Choose Viral Short (9:16), Documentary (21:9), or Listicle format. Set duration from 15 seconds to 40 minutes.",
    details: [
      "Natural language topic input",
      "Format & duration selector",
      "Optional custom script paste",
      "Voice & style preferences",
    ],
  },
  {
    step: "02",
    icon: Wand2,
    title: "AI Researches & Scripts",
    subtitle: "5–15 minutes",
    description:
      "10+ scrapers fetch live data in parallel. Claude AI synthesizes a research brief. Llama 3.1 or Claude writes a scene-by-scene script with narration, image prompts, and map coordinates.",
    details: [
      "Tavily, Jina, Serper, Exa, NewsAPI scraping",
      "Claude research brief synthesis",
      "Chronological scene JSON output",
      "Hook-driven viral script structure",
    ],
  },
  {
    step: "03",
    icon: FileText,
    title: "Assets Are Generated",
    subtitle: "10–25 minutes",
    description:
      "ElevenLabs narrates each scene with word-level timestamps. Flux generates photorealistic vertical images. Wikimedia, Pexels, and Pixabay provide real-world B-roll and archival media.",
    details: [
      "ElevenLabs multilingual voice",
      "Flux 1-dev image generation",
      "Stock & archival media fetch",
      "Wan2.1 image-to-video animation",
    ],
  },
  {
    step: "04",
    icon: Film,
    title: "Video Is Rendered",
    subtitle: "5–15 minutes",
    description:
      "Remotion assembles scene clips with Motion.dev transitions. Mapbox renders animated map sequences. FFmpeg burns subtitles, applies audio ducking, and exports final MP4.",
    details: [
      "Remotion + Motion.dev assembly",
      "Center-bottom subtitle burn-in",
      "Audio ducking & transition SFX",
      "9:16 or 21:9 MP4 download",
    ],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-white/[0.06] bg-white/[0.01] py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="section-label">How It Works</p>
          <h2 className="section-title mb-4">From Topic to Published Video</h2>
          <p className="section-subtitle">
            Four automated phases handle everything — you just enter a topic and download the MP4.
            No editing software, no film crew, no stock footage subscriptions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {steps.map(({ step, icon: Icon, title, subtitle, description, details }) => (
            <div key={step} className="glass-card-hover p-8">
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/20">
                  <Icon className="h-6 w-6 text-violet-400" />
                </div>
                <div className="text-right">
                  <span className="font-display text-3xl font-black text-white/[0.06]">{step}</span>
                  <p className="text-[10px] font-medium text-violet-400/70">{subtitle}</p>
                </div>
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold">{title}</h3>
              <p className="mb-5 text-sm leading-relaxed text-white/50">{description}</p>
              <ul className="space-y-2">
                {details.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-xs text-white/45">
                    <div className="h-1 w-1 rounded-full bg-violet-400" />
                    {d}
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
