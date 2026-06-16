import {
  Youtube,
  GraduationCap,
  Megaphone,
  Newspaper,
  Building2,
  Users,
} from "lucide-react";

const useCases = [
  {
    icon: Youtube,
    title: "YouTube Creators",
    description:
      "Produce 2–3 documentary videos per week without a film crew. Vox-style explainers, history channels, and true-crime narratives with real archival footage and professional narration.",
    stats: "21:9 cinematic · 5–40 min",
    tags: ["Explainers", "History", "True Crime"],
  },
  {
    icon: Megaphone,
    title: "Social Media Marketers",
    description:
      "Generate scroll-stopping 9:16 viral shorts from any trending topic. Claude researches live news, writes hook-driven scripts, and renders TikTok/Reels-ready MP4s with burned-in subtitles.",
    stats: "9:16 vertical · 15–90 sec",
    tags: ["TikTok", "Reels", "Shorts"],
  },
  {
    icon: GraduationCap,
    title: "Educators & Course Creators",
    description:
      "Turn complex subjects into engaging visual lessons. Multi-source Wikipedia, Serper, and Exa research ensures factual accuracy. Supports English, Hindi, Urdu via Qwen 2.5.",
    stats: "Multi-language · Subtitled",
    tags: ["E-Learning", "Tutorials", "MOOCs"],
  },
  {
    icon: Newspaper,
    title: "News & Media Outlets",
    description:
      "Rapidly produce breaking news explainers with live data from NewsAPI, Tavily, and Jina. Get a fully narrated, visual video within minutes of a story breaking.",
    stats: "Live research · 10+ APIs",
    tags: ["Breaking News", "Analysis", "Recap"],
  },
  {
    icon: Building2,
    title: "Agencies & Brands",
    description:
      "White-label video production for clients at scale. Admin dashboard controls all API keys. Batch-generate branded content with consistent ElevenLabs voice and Flux visual style.",
    stats: "Admin API control · Pro plan",
    tags: ["Agency", "B2B", "Scale"],
  },
  {
    icon: Users,
    title: "Indie Filmmakers",
    description:
      "Prototype documentary concepts before investing in production. DeepVideo-V1 character cinematics, LivePortrait lip-sync, and Wan2.1 animation for historical figure scenes.",
    stats: "Character AI · Archival media",
    tags: ["Prototype", "Indie", "Pitch"],
  },
];

export function UseCases() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="section-label">Use Cases</p>
          <h2 className="section-title mb-4">Built for Every Type of Creator</h2>
          <p className="section-subtitle">
            Whether you run a YouTube channel, manage brand social accounts, or teach
            online — DocuForge adapts to your workflow with two distinct output formats.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map(({ icon: Icon, title, description, stats, tags }) => (
            <div key={title} className="glass-card-hover flex flex-col p-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 ring-1 ring-violet-500/20">
                <Icon className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold">{title}</h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-white/50">
                {description}
              </p>
              <p className="mb-3 text-xs font-medium text-violet-400/80">{stats}</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
