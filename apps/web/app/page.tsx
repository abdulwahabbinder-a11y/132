import Link from "next/link";
import { PricingSection } from "@/components/PricingSection";

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">
            AI Documentary Studio
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
            Generate premium documentary videos from one topic.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Script with Llama 3.1 or Qwen 2.5, scrape public archives, synthesize
            ElevenLabs narration, animate visuals with Wan2.1 and DeepVideo-V1,
            then assemble a cinematic 21:9 Remotion export.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/dashboard" className="rounded-full bg-gold px-6 py-3 font-bold text-ink hover:bg-white">
              Open studio
            </Link>
            <Link href="/pricing" className="rounded-full border border-white/15 px-6 py-3 font-bold text-white hover:border-gold">
              View pricing
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-black/40 p-5 shadow-glow">
          <div className="aspect-[21/9] rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-ember/40 p-6">
            <div className="flex h-full flex-col justify-between">
              <div className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                VOX x Mighty Monk workflow
              </div>
              <div>
                <p className="text-3xl font-black">Empire, maps, archival photos, subtitles.</p>
                <p className="mt-2 text-sm text-slate-300">Procedural Remotion scene graph ready for render.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <PricingSection />
    </main>
  );
}
