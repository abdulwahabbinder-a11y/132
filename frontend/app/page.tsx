import Link from "next/link";

import { PricingSection } from "@/components/pricing-section";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-10 shadow-xl">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-blue-300">AI Documentary SaaS</p>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight">
          Automate premium, high-retention documentary videos in the visual style of modern explainers.
        </h1>
        <p className="mt-5 max-w-3xl text-slate-300">
          Generate research-backed scripts, fetch archival media, synthesize narration, animate historical scenes, and
          render cinema-grade 21:9 videos with Remotion and FFmpeg.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-blue-500 px-5 py-2 font-semibold text-white transition hover:bg-blue-400"
          >
            Open Dashboard
          </Link>
          <a href="#pricing" className="rounded-full border border-slate-600 px-5 py-2 text-slate-200">
            View Pricing
          </a>
        </div>
      </section>
      <PricingSection />
    </div>
  );
}
