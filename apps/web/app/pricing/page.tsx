import { PricingSection } from "@/components/PricingSection";

export default function PricingPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">Pricing</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
          Start free, scale to monthly documentary production.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          The Pro plan resets credits to 30 on Stripe subscription creation and
          unlocks the complete automated media and render pipeline.
        </p>
      </section>
      <PricingSection />
    </main>
  );
}
