import { appConfig } from "@/lib/config";

const plans = [
  {
    name: "Free Plan",
    price: "$0",
    cadence: "forever",
    description: "Test the documentary workflow, validate prompts, and prototype briefs.",
    ctaLabel: "Start free",
    href: appConfig.stripeFreeUrl,
    bullets: ["Starter credits", "Supabase auth", "Basic queue visibility", "Community support"],
    highlighted: false,
  },
  {
    name: "Pro Plan",
    price: "$29",
    cadence: "/month",
    description:
      "Unlock the production-grade pipeline with monthly credit refresh, premium rendering, and billing sync.",
    ctaLabel: "Upgrade to Pro",
    href: appConfig.stripeProUrl,
    bullets: [
      "30 video credits / billing cycle",
      "Stripe subscription management",
      "DeepVideo-V1 + LivePortrait orchestration",
      "Priority rendering support",
    ],
    highlighted: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="space-y-8">
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Pricing</p>
        <h2 className="text-4xl font-semibold text-white">Subscription plans built for SaaS video teams</h2>
        <p className="mx-auto max-w-2xl text-slate-300">
          Each plan maps directly to the Stripe billing model and Supabase subscription ledger in
          the backend.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-3xl border p-8 ${
              plan.highlighted
                ? "border-cyan-400/50 bg-cyan-400/10 shadow-xl shadow-cyan-950/30"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="space-y-5">
              <div>
                <p className="text-lg font-semibold text-white">{plan.name}</p>
                <p className="mt-3 text-5xl font-semibold text-white">
                  {plan.price}
                  <span className="text-lg text-slate-400">{plan.cadence}</span>
                </p>
              </div>
              <p className="text-slate-300">{plan.description}</p>
              <ul className="space-y-3 text-sm text-slate-200">
                {plan.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    {bullet}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`inline-flex rounded-full px-5 py-3 text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-white text-black hover:bg-slate-200"
                    : "border border-white/15 text-white hover:border-cyan-300/60 hover:text-cyan-200"
                }`}
              >
                {plan.ctaLabel}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
