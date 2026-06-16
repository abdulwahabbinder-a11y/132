import { Search, Wand2, Download } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Enter Your Topic",
    description:
      "Describe any subject — our 10+ scrapers fetch live data from Tavily, Jina, Serper, Exa, Wikipedia, and more.",
  },
  {
    step: "02",
    icon: Wand2,
    title: "AI Builds Everything",
    description:
      "Claude synthesizes research, writes the script, Flux generates visuals, and ElevenLabs narrates with word-level timestamps.",
  },
  {
    step: "03",
    icon: Download,
    title: "Download & Publish",
    description:
      "Remotion + FFmpeg render your 9:16 viral short or 21:9 documentary with burned-in subtitles — ready to upload.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-white/[0.06] bg-white/[0.01] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
            How It Works
          </p>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Topic to Video in 3 Steps
          </h2>
          <p className="mx-auto max-w-xl text-white/50">
            No editing skills needed. DocuForge handles research, scripting, assets, and rendering automatically.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8">
              <span className="mb-4 block text-4xl font-black text-white/[0.06]">{step}</span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15">
                <Icon className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
