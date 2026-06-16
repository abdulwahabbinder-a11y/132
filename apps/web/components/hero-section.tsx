import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-panel via-ink to-black px-8 py-16 shadow-2xl shadow-cyan-950/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.18),_transparent_35%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
            Premium AI documentary automation for YouTube-scale editorial storytelling
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Generate cinematic documentary videos with research, narration, motion, and
              render orchestration in one SaaS pipeline.
            </h1>
            <p className="max-w-3xl text-lg text-slate-300">
              DocGen combines Supabase, Stripe, NVIDIA NIM, ElevenLabs, public archival
              scraping, DeepVideo-V1, LivePortrait, Wan2.1, and Remotion into a modular
              documentary production system designed for premium retention.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              Open dashboard
            </Link>
            <a
              href="#pricing"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/60 hover:text-cyan-200"
            >
              View pricing
            </a>
          </div>
        </div>
        <div className="grid gap-4 text-sm text-slate-200">
          {[
            "Strict chronological JSON storytelling via Llama 3.1 / Qwen 2.5",
            "Wikipedia, Wikidata, Commons, Internet Archive, Pexels, and Pixabay fetching",
            "ElevenLabs timestamped narration + subtitle timeline output",
            "DeepVideo-V1 character enhancement and Remotion 21:9 assembly",
          ].map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
