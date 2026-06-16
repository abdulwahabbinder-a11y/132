"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import type { Plan } from "@/lib/types";

const FALLBACK_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Plan",
    price_usd: 0,
    interval: "month",
    credits: 3,
    features: [
      "3 documentary credits",
      "720p exports",
      "Watermarked output",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    price_usd: 29,
    interval: "month",
    credits: 30,
    features: [
      "30 documentary credits / month",
      "21:9 cinematic 4K exports",
      "No watermark",
      "Neural character cinematics (DeepVideo-V1)",
      "Priority rendering queue",
    ],
  },
];

export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPlans()
      .then((res) => setPlans(res.plans))
      .catch(() => setPlans(FALLBACK_PLANS));
  }, []);

  async function startCheckout(plan: Plan) {
    setError(null);
    if (plan.id === "free") {
      window.location.href = "/dashboard";
      return;
    }
    setLoadingPlan(plan.id);
    try {
      const origin = window.location.origin;
      const { checkout_url } = await api.createCheckout(
        `${origin}/dashboard?upgraded=1`,
        `${origin}/pricing`
      );
      window.location.href = checkout_url;
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status === 401
          ? "Please sign in to upgrade."
          : e instanceof Error
            ? e.message
            : "Could not start checkout.";
      setError(msg);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <section id="pricing" className="container-x py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="pill">Simple, transparent pricing</span>
        <h2 className="mt-4 font-display text-4xl font-bold">
          Pick your <span className="gradient-text">studio plan</span>
        </h2>
        <p className="mt-3 text-slate-400">
          Start free. Upgrade to Pro for cinematic 21:9 exports and neural
          character cinematics.
        </p>
      </div>

      {error && (
        <p className="mt-6 text-center text-sm text-red-400">{error}</p>
      )}

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((plan, i) => {
          const isPro = plan.id === "pro";
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`card relative p-8 ${
                isPro ? "ring-2 ring-brand-500 shadow-glow" : ""
              }`}
            >
              {isPro && (
                <span className="absolute -top-3 left-8 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-5xl font-bold">${plan.price_usd}</span>
                <span className="mb-1 text-slate-400">/{plan.interval}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    <span className="text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => startCheckout(plan)}
                disabled={loadingPlan === plan.id}
                className={`mt-8 w-full ${isPro ? "btn-primary" : "btn-ghost"}`}
              >
                {loadingPlan === plan.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {isPro ? "Upgrade to Pro" : "Start for free"}
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
