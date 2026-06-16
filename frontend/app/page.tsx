import Link from "next/link";
import { PricingSection } from "@/components/PricingSection";
import { ArrowRight, Brain, Globe2, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(244,197,66,0.18),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-widest text-white/70">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Llama 3.1 · Qwen 2.5 · Flux · DeepVideo-V1 · Remotion
          </span>
          <h1 className="mt-6 font-display text-6xl font-bold leading-tight md:text-7xl">
            Cinema-grade documentaries.
            <br />
            <span className="text-accent">In a single prompt.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            DocuGen orchestrates LLM scripting, public-source scraping, neural
            character rendering and Remotion composition to ship
            <em> Mighty Monk</em>-grade videos — fully automated, 21:9
            cinematic master.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/generate" className="btn-primary text-base">
              Start generating
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#pricing" className="btn-secondary text-base">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            icon={<Brain className="h-5 w-5 text-accent" />}
            title="Multi-LLM Scripting"
            body="Llama 3.1 70B for English; Qwen 2.5 72B for Hindi, Urdu & Roman scripts. Strict scene-JSON schema with verifiable facts."
          />
          <Feature
            icon={<Globe2 className="h-5 w-5 text-accent" />}
            title="Public-Source Footage"
            body="Wikipedia, Wikimedia Commons, Internet Archive, Pexels & Pixabay — every clip credited and license-clean."
          />
          <Feature
            icon={<Sparkles className="h-5 w-5 text-accent" />}
            title="Neural Characters"
            body="LivePortrait lip-sync + DeepVideo-V1 micro-expressions and temporal consistency. No flicker, no warping."
          />
        </div>
      </section>

      <section id="pricing">
        <PricingSection />
      </section>
    </>
  );
}

const Feature = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <div className="card">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
      {icon}
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-white/70">{body}</p>
  </div>
);
