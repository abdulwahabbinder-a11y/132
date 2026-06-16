import Link from "next/link";

const proUrl =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_URL ?? "https://stripe.com";

export function PricingSection() {
  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-2">
      <PlanCard
        eyebrow="Starter"
        title="Free Plan"
        price="$0"
        cta="Start creating"
        href="/dashboard"
        features={[
          "3 trial video credits",
          "Strict JSON story generation",
          "Public web media discovery",
          "Watermark-ready render workflow"
        ]}
      />
      <PlanCard
        featured
        eyebrow="Studio"
        title="Pro Plan"
        price="$29/month"
        cta="Upgrade with Stripe"
        href={proUrl}
        features={[
          "30 monthly documentary credits",
          "Llama 3.1 and Qwen 2.5 routing",
          "ElevenLabs subtitles and voice timing",
          "Remotion 21:9 cinematic exports"
        ]}
      />
    </section>
  );
}

function PlanCard({
  eyebrow,
  title,
  price,
  cta,
  href,
  features,
  featured = false
}: {
  eyebrow: string;
  title: string;
  price: string;
  cta: string;
  href: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-8 shadow-glow ${
        featured
          ? "border-gold bg-white text-ink"
          : "border-white/10 bg-white/[0.04] text-white"
      }`}
    >
      <p className={`text-sm font-semibold uppercase tracking-[0.3em] ${featured ? "text-ember" : "text-gold"}`}>
        {eyebrow}
      </p>
      <h3 className="mt-4 text-3xl font-bold">{title}</h3>
      <p className="mt-3 text-5xl font-black tracking-tight">{price}</p>
      <ul className="mt-8 space-y-3 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span className="text-ember">•</span>
            <span className={featured ? "text-slate-700" : "text-slate-300"}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold ${
          featured
            ? "bg-ink text-white hover:bg-slate-800"
            : "bg-white text-ink hover:bg-gold"
        }`}
      >
        {cta}
      </Link>
    </article>
  );
}
