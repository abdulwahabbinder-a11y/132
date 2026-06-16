"use client";

import { motion } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { clientEnv } from "@/lib/env";

const plans = [
  {
    name: "Free Plan",
    price: "$0",
    cadence: "/month",
    cta: "Start Free",
    href: clientEnv.NEXT_PUBLIC_STRIPE_FREE_PLAN_URL || "#signup",
    features: [
      "3 documentary renders included",
      "Chronological script generation",
      "Basic research and archival fetch",
      "Remotion preview-ready scenes",
    ],
  },
  {
    name: "Pro Plan",
    price: "$29",
    cadence: "/month",
    cta: "Upgrade to Pro",
    href: clientEnv.NEXT_PUBLIC_STRIPE_PRO_PLAN_URL || "#signup",
    highlight: true,
    features: [
      "30 video credits reset every billing cycle",
      "Llama 3.1 / Qwen 2.5 multilingual routing",
      "Premium archival + stock media orchestration",
      "DeepVideo-V1, LivePortrait, Wan and subtitle pipeline",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20 lg:px-12">
      <div className="max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-sky-200">
          <Sparkles className="h-4 w-4" />
          Subscription-ready documentary automation
        </div>
        <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Start free, then scale into a full premium publishing pipeline.
        </h2>
        <p className="text-lg text-slate-300">
          Each plan includes Supabase auth, script generation, automated asset research, and
          one-click render orchestration.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan, index) => (
          <motion.a
            key={plan.name}
            href={plan.href}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.12 }}
            className={[
              "group rounded-3xl border p-8 transition-transform hover:-translate-y-1",
              plan.highlight
                ? "border-sky-400/70 bg-sky-500/10 shadow-[0_0_70px_rgba(56,189,248,0.15)]"
                : "border-white/10 bg-white/5",
            ].join(" ")}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                {plan.highlight ? (
                  <span className="rounded-full bg-sky-400 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-950">
                    Most Popular
                  </span>
                ) : null}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-semibold text-white">{plan.price}</span>
                <span className="pb-1 text-base text-slate-300">{plan.cadence}</span>
              </div>
              <ul className="space-y-3 text-slate-200">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-2 pt-4 text-sm font-semibold text-sky-200">
                {plan.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
