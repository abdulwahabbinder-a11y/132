import { AuthPanel } from "@/components/AuthPanel";
import { Dashboard } from "@/components/Dashboard";
import { PricingSection } from "@/components/PricingSection";

export default function HomePage() {
  return (
    <main>
      <section className="grain overflow-hidden border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-28">
          <div className="relative z-10">
            <p className="text-sm uppercase tracking-[0.4em] text-signal">AI documentary SaaS</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
              Generate premium cinematic documentaries from a single topic.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              ChronicleAI routes scripts through Llama 3.1 or Qwen 2.5, gathers public evidence and licensed B-roll,
              synthesizes narration, animates characters, and renders a 21:9 Remotion film.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 px-4 py-2">DeepVideo-V1</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Remotion.dev</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Motion.dev</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Automatic public scraping</span>
            </div>
          </div>
          <div className="relative z-10 self-center">
            <AuthPanel />
          </div>
        </div>
      </section>
      <Dashboard />
      <PricingSection />
    </main>
  );
}
