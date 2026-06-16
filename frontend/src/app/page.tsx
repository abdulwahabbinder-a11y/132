import Link from "next/link";
import { ArrowRight, Bot, Clapperboard, Languages, Map, Sparkles } from "lucide-react";

import { PricingSection } from "@/components/pricing-section";

const capabilityCards = [
  {
    title: "Research-first scripting",
    description:
      "Authenticated story generation routes English to Llama 3.1 and South Asian scripts to Qwen 2.5 while preserving strict chronological JSON output.",
    icon: Bot,
  },
  {
    title: "Archival + AI visual sourcing",
    description:
      "Each scene can scrape Wikipedia, Wikidata, Wikimedia Commons, Internet Archive, Pexels, Pixabay, or trigger Flux image generation for abstract sequences.",
    icon: Sparkles,
  },
  {
    title: "Cinematic assembly",
    description:
      "Remotion + Motion.dev orchestrate maps, subtitles, layout transitions, and FFmpeg ducking into a 21:9 documentary export pipeline.",
    icon: Clapperboard,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#020617_40%,_#0f172a_100%)] text-white">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <section className="grid gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-28">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-sky-200">
              <Sparkles className="h-4 w-4" />
              Premium AI documentary SaaS stack
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Generate Mighty Monk and Vox-style documentary videos from one prompt.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Automate scripts, fact research, archival sourcing, AI imagery, narration,
                cinematic motion, subtitles, and final 21:9 Remotion renders with a
                subscription-based workflow.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                Open production dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 font-semibold text-white transition hover:border-sky-300 hover:text-sky-200"
              >
                View pricing
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <Languages className="mb-4 h-5 w-5 text-sky-300" />
                <div className="text-sm font-semibold text-white">Multilingual routing</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  English uses Llama 3.1, while Hindi, Urdu, and Roman scripts route to Qwen 2.5.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <Map className="mb-4 h-5 w-5 text-sky-300" />
                <div className="text-sm font-semibold text-white">Map-driven storytelling</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Location coordinates power animated geopolitical map sequences inside Remotion.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <Clapperboard className="mb-4 h-5 w-5 text-sky-300" />
                <div className="text-sm font-semibold text-white">Production orchestration</div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  DeepVideo-V1, LivePortrait, Wan, ElevenLabs, and FFmpeg work in one queued pipeline.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_0_80px_rgba(56,189,248,0.12)]">
            <div className="space-y-4">
              <div className="text-sm uppercase tracking-[0.25em] text-sky-200">Pipeline overview</div>
              <div className="grid gap-4">
                {[
                  "Supabase auth + Stripe credit resets",
                  "Strict JSON story generation",
                  "Wikipedia/Wikidata verification",
                  "Wikimedia + Internet Archive retrieval",
                  "Pexels/Pixabay B-roll selection",
                  "ElevenLabs narration + subtitle timestamps",
                  "Wan / LivePortrait / DeepVideo character rendering",
                  "Remotion + Motion.dev final composition",
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/15 text-sm font-semibold text-sky-300">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm text-slate-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 px-6 pb-6 lg:grid-cols-3 lg:px-12">
          {capabilityCards.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <Icon className="mb-5 h-6 w-6 text-sky-300" />
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </article>
          ))}
        </section>

        <PricingSection />
      </main>
    </div>
  );
}
