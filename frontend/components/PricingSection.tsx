"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    summary: "Explore the engine — 3 short documentaries per month.",
    features: [
      "3 documentary credits / month",
      "Up to 60-second outputs",
      "DocuGen watermark",
      "Pexels & Pixabay sources",
      "1080p export",
    ],
    cta: "Start free",
    ctaTone: "ghost" as const,
    badge: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    cadence: "/ month",
    summary: "Full 21:9 cinematic engine, 30 credits, all archival sources.",
    features: [
      "30 documentary credits / month",
      "Up to 30-minute outputs",
      "No watermark, 4K cinematic export",
      "DeepVideo-V1 character cinematics",
      "Wikimedia, Internet Archive, Flux 1-dev",
      "ElevenLabs voice cloning",
      "Priority NIM render queue",
    ],
    cta: "Upgrade to Pro",
    ctaTone: "primary" as const,
    badge: "Most popular",
  },
] as const;

export function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: "free" | "pro") {
    setError(null);
    if (plan === "free") {
      window.location.href = "/dashboard";
      return;
    }
    try {
      setLoading(plan);
      const { url } = await api.startCheckout();
      window.location.href = url;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login?redirect=/pricing";
        return;
      }
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Pricing
          </div>
          <h2 className="mt-4 text-4xl md:text-5xl font-display font-bold">
            One subscription. <span className="text-accent">Infinite documentaries.</span>
          </h2>
          <p className="mt-4 text-white/60">
            From a one-line topic to a polished 21:9 cinematic MP4 — scripted, scraped,
            narrated, and rendered automatically.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TIERS.map((tier) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`glass relative rounded-2xl p-8 ${
                tier.id === "pro" ? "ring-1 ring-accent/60" : ""
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-8 px-3 py-1 rounded-full bg-accent text-black text-xs font-semibold">
                  {tier.badge}
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-semibold">{tier.name}</h3>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-display font-bold">{tier.price}</span>
                <span className="text-white/50">{tier.cadence}</span>
              </div>
              <p className="mt-3 text-white/60">{tier.summary}</p>

              <ul className="mt-8 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-white/80">
                    <Check className="h-5 w-5 mt-0.5 text-accent shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleUpgrade(tier.id as "free" | "pro")}
                disabled={loading === tier.id}
                className={`mt-10 w-full ${
                  tier.ctaTone === "primary" ? "btn-primary" : "btn-ghost"
                } ${loading === tier.id ? "opacity-60 cursor-wait" : ""}`}
              >
                {loading === tier.id ? "Redirecting…" : tier.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {error && (
          <div className="mt-6 text-center text-red-400 text-sm">{error}</div>
        )}
      </div>
    </section>
  );
}
