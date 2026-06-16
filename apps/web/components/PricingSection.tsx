import { Check } from "lucide-react";
import { env } from "@/lib/env";

const plans = [
  {
    name: "Free Plan",
    price: "$0",
    href: env.freePlanUrl,
    description: "Experiment with the end-to-end documentary workflow.",
    features: ["1 starter video credit", "Supabase-authenticated dashboard", "Public data and media discovery"]
  },
  {
    name: "Pro Plan",
    price: "$29/month",
    href: env.proPlanUrl,
    description: "Production plan for creators publishing premium documentaries.",
    features: ["30 video credits per billing cycle", "DeepVideo-V1 character pipeline", "ElevenLabs subtitles and Remotion rendering"],
    highlighted: true
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.35em] text-brass">Subscription studio</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Plans built around video credits.</h2>
        <p className="mt-4 text-slate-300">
          Stripe subscriptions reset Pro accounts to 30 credits through the backend webhook.
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <a
            key={plan.name}
            href={plan.href}
            className={`group rounded-3xl border p-7 transition hover:-translate-y-1 ${
              plan.highlighted
                ? "border-signal/70 bg-signal/10 shadow-glow"
                : "border-white/10 bg-white/[0.04] hover:border-white/25"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">Stripe</span>
            </div>
            <p className="mt-7 text-4xl font-bold">{plan.price}</p>
            <ul className="mt-7 space-y-3 text-sm text-slate-200">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-signal" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <span className="mt-8 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-ink transition group-hover:bg-signal">
              Choose {plan.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
