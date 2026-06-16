import { HeroSection } from "@/components/hero-section";
import { PricingSection } from "@/components/pricing-section";

const architectureCards = [
  {
    title: "Scripting router",
    description:
      "Routes story generation to Llama 3.1 for English and Qwen 2.5 for Hindi, Urdu, and Romanized scripts with schema-validated scene output.",
  },
  {
    title: "Public data worker",
    description:
      "Scrapes Wikipedia, Wikidata, Wikimedia Commons, Internet Archive, Pexels, and Pixabay before falling back to Flux art generation for abstract scenes.",
  },
  {
    title: "Character engine",
    description:
      "Combines ElevenLabs timestamps, LivePortrait lip sync, DeepVideo-V1 enhancement, and Wan2.1 motion generation for scene-level clips.",
  },
  {
    title: "Cinematic assembly",
    description:
      "Builds a 21:9 Remotion composition with Motion.dev transitions, animated geo overlays, subtitle burns, transition sounds, and FFmpeg ducking.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-14 pb-16">
      <HeroSection />
      <section className="grid gap-6 lg:grid-cols-2">
        {architectureCards.map((card) => (
          <article key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{card.title}</p>
            <p className="mt-4 text-lg leading-8 text-slate-200">{card.description}</p>
          </article>
        ))}
      </section>
      <PricingSection />
    </div>
  );
}
