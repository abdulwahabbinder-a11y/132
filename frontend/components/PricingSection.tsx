"use client";

import { useState } from "react";
import { Check, Loader2, Zap, Crown, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for trying DocuForge and creating your first viral shorts.",
    credits: 3,
    perVideo: "Free",
    icon: Sparkles,
    features: [
      "3 video credits (one-time)",
      "Viral Short 9:16 format",
      "English scripting (Llama 3.1)",
      "5 scrapers (Tavily, Jina, Wikipedia + more)",
      "ElevenLabs standard voice",
      "720p output with subtitles",
      "Community support",
    ],
    notIncluded: ["Documentary 21:9 format", "Claude research brief", "DeepVideo characters", "Priority queue"],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious creators publishing weekly content across platforms.",
    credits: 30,
    perVideo: "$0.97",
    icon: Crown,
    features: [
      "30 video credits per month",
      "All formats: Viral Short + Documentary + Listicle",
      "All 10+ scrapers with parallel research",
      "Claude AI research brief synthesis",
      "Llama 3.1 + Qwen 2.5 (Hindi, Urdu, Roman)",
      "DeepVideo-V1 character cinematics",
      "21:9 cinematic 1080p + 9:16 vertical",
      "Flux AI images + Wan2.1 animation",
      "ElevenLabs premium multilingual voices",
      "Priority rendering queue",
      "Commercial usage rights",
      "Admin API key dashboard",
    ],
    notIncluded: [],
    cta: "Start Pro — $29/mo",
    highlighted: true,
  },
];

export function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (planId === "free") { window.location.href = "/auth/signup"; return; }
    setLoading(planId);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/signup?plan=pro"; return; }
      api.setToken(session.access_token);
      const { checkout_url } = await api.createCheckout("pro");
      window.location.href = checkout_url;
    } catch {
      alert("Failed to start checkout. Please sign in and try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <p className="section-label">Pricing</p>
          <h2 className="section-title mb-4">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">
            Start free with 3 credits. Upgrade to Pro when you&apos;re ready to publish at scale.
            Each credit = one complete video (research → script → assets → render).
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-8 transition",
                  plan.highlighted
                    ? "border-violet-500/40 bg-gradient-to-b from-violet-500/10 via-fuchsia-500/5 to-transparent shadow-xl shadow-violet-500/10"
                    : "border-white/[0.08] bg-white/[0.02]"
                )}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </span>
                )}

                <div className="mb-6 flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", plan.highlighted ? "bg-violet-500/20" : "bg-white/5")}>
                    <Icon className={cn("h-5 w-5", plan.highlighted ? "text-violet-400" : "text-white/50")} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                    <p className="text-xs text-white/40">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-1 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold">{plan.price}</span>
                  <span className="text-white/40">{plan.period}</span>
                </div>
                <div className="mb-6 flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-violet-400" />{plan.credits} credits</span>
                  <span>·</span>
                  <span>{plan.perVideo} per video</span>
                </div>

                <ul className="mb-4 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/25 line-through">
                      <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-xs">—</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={cn(
                    "w-full rounded-xl py-3.5 text-sm font-semibold transition",
                    plan.highlighted
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/20 hover:brightness-110"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10",
                    loading === plan.id && "opacity-70"
                  )}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </span>
                  ) : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          All plans include SSL encryption, Supabase auth, and automatic credit restore on failed jobs.
          <a href="/refund-policy" className="ml-1 text-violet-400 hover:underline">7-day money-back guarantee</a> on Pro.
        </p>
      </div>
    </section>
  );
}
