"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Plan {
  id: "free" | "pro";
  name: string;
  price: string;
  cadence: string;
  highlight?: boolean;
  cta: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Plan",
    price: "$0",
    cadence: "forever",
    cta: "Start for free",
    features: [
      "3 documentary credits / month",
      "Up to 12 scenes per video",
      "Stock footage + archival media",
      "720p export with watermark",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: "$29",
    cadence: "per month",
    highlight: true,
    cta: "Upgrade to Pro",
    features: [
      "30 documentary credits / month",
      "Up to 40 scenes per video",
      "DeepVideo-V1 character cinematics",
      "ElevenLabs premium narration",
      "Animated geopolitical maps",
      "4K cinematic 21:9 export, no watermark",
    ],
  },
];

export function PricingSection() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(plan: Plan) {
    setError(null);
    if (plan.id === "free") {
      router.push("/dashboard");
      return;
    }
    setLoading(plan.id);
    try {
      const { checkout_url } = await api.createCheckout();
      window.location.href = checkout_url;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login?next=/pricing");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not start checkout."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white">Simple, scalable pricing</h2>
        <p className="mt-3 text-white/60">
          Start free. Upgrade when you are ready to ship premium documentaries.
        </p>
      </div>

      {error && (
        <p className="mx-auto mt-6 max-w-md rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={`card relative p-8 ${
              plan.highlight ? "ring-2 ring-brand-500 shadow-glow" : ""
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-8 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-5xl font-extrabold text-white">
                {plan.price}
              </span>
              <span className="mb-1 text-sm text-white/50">/{plan.cadence}</span>
            </div>

            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-white/80">
                  <Check size={18} className="mt-0.5 shrink-0 text-brand-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelect(plan)}
              disabled={loading === plan.id}
              className={`mt-8 w-full ${
                plan.highlight ? "btn-primary" : "btn-ghost"
              }`}
            >
              {loading === plan.id ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Redirecting…
                </>
              ) : (
                plan.cta
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
