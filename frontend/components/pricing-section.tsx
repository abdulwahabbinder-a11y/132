"use client";

const plans = [
  {
    title: "Free Plan",
    price: "$0",
    subtitle: "For testing the documentary engine",
    features: ["3 one-time credits", "720p exports", "Community support"],
    cta: "Start Free",
    href: "/dashboard",
    highlighted: false,
  },
  {
    title: "Pro Plan",
    price: "$29/month",
    subtitle: "For creators publishing weekly premium stories",
    features: [
      "30 credits reset each billing cycle",
      "Full AI + archival pipeline",
      "21:9 cinematic exports",
      "Priority render queue",
    ],
    cta: "Upgrade to Pro",
    href: process.env.NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_URL ?? "#",
    highlighted: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="space-y-6">
      <h2 className="text-3xl font-semibold">Simple pricing for documentary creators</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.title}
            className={`rounded-2xl border p-8 ${
              plan.highlighted ? "border-blue-400 bg-blue-900/20" : "border-white/10 bg-slate-950/50"
            }`}
          >
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">{plan.title}</p>
            <p className="mt-3 text-4xl font-bold">{plan.price}</p>
            <p className="mt-2 text-slate-300">{plan.subtitle}</p>
            <ul className="mt-6 space-y-2 text-sm text-slate-200">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <a
              href={plan.href}
              className={`mt-8 inline-flex rounded-full px-4 py-2 font-semibold ${
                plan.highlighted
                  ? "bg-blue-500 text-white hover:bg-blue-400"
                  : "border border-slate-600 text-slate-100 hover:border-slate-400"
              }`}
            >
              {plan.cta}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
