const plans = [
  {
    name: "Free Plan",
    price: "$0",
    features: ["3 starter video credits", "Standard queue priority", "Community templates"],
    cta: "Start for Free",
    href:
      process.env.NEXT_PUBLIC_STRIPE_FREE_CHECKOUT_LINK ??
      "https://dashboard.stripe.com/register",
    highlighted: false
  },
  {
    name: "Pro Plan",
    price: "$29/month",
    features: [
      "30 credits reset every billing cycle",
      "Priority rendering and faster queue",
      "Premium cinematic voice + subtitle pipeline"
    ],
    cta: "Upgrade to Pro",
    href: process.env.NEXT_PUBLIC_STRIPE_PRO_CHECKOUT_LINK ?? "#",
    highlighted: true
  }
];

export function PricingSection() {
  return (
    <section className="mt-12">
      <h2 className="text-3xl font-semibold">Pricing</h2>
      <p className="mt-2 text-slate-400">
        Choose a plan and connect billing through Stripe checkout links.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl border p-6 ${
              plan.highlighted
                ? "border-violet-500/50 bg-violet-950/20"
                : "border-slate-800 bg-slate-900/80"
            }`}
          >
            <p className="text-sm uppercase tracking-[0.15em] text-slate-300">{plan.name}</p>
            <p className="mt-3 text-3xl font-semibold">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <a
              href={plan.href}
              className={`mt-6 inline-flex rounded-lg px-4 py-2 text-sm font-medium ${
                plan.highlighted
                  ? "bg-violet-500 text-white hover:bg-violet-400"
                  : "border border-slate-600 text-slate-100 hover:bg-slate-800"
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
