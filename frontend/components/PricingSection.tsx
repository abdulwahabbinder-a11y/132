"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  highlight?: boolean;
  cta: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "/forever",
    cta: "Start free",
    features: [
      "3 documentary credits on signup",
      "1080p export",
      "Public source library access",
      "Watermarked output",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "/month",
    highlight: true,
    cta: "Upgrade to Pro",
    features: [
      "30 documentary credits / month",
      "21:9 cinematic 4K master",
      "DeepVideo-V1 character rendering",
      "Animated geopolitical maps",
      "No watermark · commercial license",
      "Priority queue + email support",
    ],
  },
];

export const PricingSection = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onUpgrade = async (plan: Plan) => {
    if (plan.name === "Free") {
      window.location.href = "/auth/sign-up";
      return;
    }
    setError(null);
    setLoading(plan.name);
    try {
      const { checkout_url } = await api.startCheckout();
      window.location.href = checkout_url;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="font-display text-4xl font-bold md:text-5xl">
          Simple, scene-based pricing
        </h2>
        <p className="mt-3 text-white/70">
          Every credit buys one full documentary, scripted, rendered & exported.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "card flex flex-col gap-6",
              plan.highlight && "border-accent/40 shadow-glow"
            )}
          >
            <div>
              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-white/60">{plan.cadence}</span>
              </div>
            </div>

            <ul className="flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={loading === plan.name}
              onClick={() => onUpgrade(plan)}
              className={cn(
                plan.highlight ? "btn-primary" : "btn-secondary",
                "w-full"
              )}
            >
              {loading === plan.name && <Loader2 className="h-4 w-4 animate-spin" />}
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-6 text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};
