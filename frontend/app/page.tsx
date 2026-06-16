import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-14">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-violet-300">DocuForge AI</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Build Vox-style and Mighty Monk-style documentary videos automatically.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Script, scrape, animate, narrate, and render cinematic 21:9 documentary episodes using
          a production pipeline powered by NVIDIA NIM, Remotion, and FastAPI.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition hover:opacity-90"
          >
            Open Dashboard
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200"
          >
            Deployment Guide
          </a>
        </div>
      </section>
      <PricingSection />
    </main>
  );
}
