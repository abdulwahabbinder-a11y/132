"use client";

import { useState } from "react";
import { Check, Loader2, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free Plan",
    price: "$0",
    period: "forever",
    description: "Try DocuForge with limited credits",
    credits: 3,
    features: [
      "3 video credits",
      "English scripting (Llama 3.1)",
      "Standard B-roll sourcing",
      "720p output",
      "Community support",
    ],
    cta: "Get Started Free",
    highlighted: false,
    stripeAction: null as "free" | "pro" | null,
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: "$29",
    period: "/month",
    description: "For creators producing premium documentaries",
    credits: 30,
    features: [
      "30 video credits per month",
      "All languages (Llama + Qwen 2.5)",
      "DeepVideo-V1 character cinematics",
      "21:9 cinematic 1080p output",
      "Archival media + Flux AI art",
      "Priority rendering queue",
      "ElevenLabs premium voices",
    ],
    cta: "Subscribe to Pro",
    highlighted: true,
    stripeAction: "pro" as const,
  },
];

export function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (planId === "free") {
      window.location.href = "/auth/signup";
      return;
    }

    setLoading(planId);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/auth/signup?plan=pro";
        return;
      }

      api.setToken(session.access_token);
      const { checkout_url } = await api.createCheckout("pro");
      window.location.href = checkout_url;
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to start checkout. Please sign in and try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto max-w-2xl text-white/60">
            Start free, upgrade when you need premium documentary production at scale.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border p-8 transition",
                plan.highlighted
                  ? "border-brand-500 bg-gradient-to-b from-brand-500/10 to-transparent shadow-lg shadow-brand-500/10"
                  : "border-white/10 bg-white/5"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold">
                  MOST POPULAR
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-white/50">{plan.description}</p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">{plan.price}</span>
                <span className="text-white/50">{plan.period}</span>
              </div>

              <div className="mb-6 flex items-center gap-2 text-sm text-brand-500">
                <Zap className="h-4 w-4" />
                {plan.credits} video credits
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                className={cn(
                  "w-full rounded-lg py-3 text-sm font-semibold transition",
                  plan.highlighted
                    ? "bg-brand-500 text-white hover:bg-brand-600"
                    : "border border-white/20 bg-white/5 text-white hover:bg-white/10",
                  loading === plan.id && "opacity-70"
                )}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
