"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, Crown, Loader2 } from "lucide-react";
import { PLANS, createCheckoutSession } from "@/lib/stripe";
import toast from "react-hot-toast";
import Link from "next/link";

export function PricingSection() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!PLANS.PRO.priceId) {
      toast.error("Stripe not configured");
      return;
    }
    setLoading(true);
    try {
      const url = await createCheckoutSession(PLANS.PRO.priceId);
      window.location.href = url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-28 px-4 bg-surface-card/20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge bg-yellow-600/20 text-yellow-400 mb-4">Simple Pricing</span>
          <h2 className="section-title mb-4">Start Free, Scale as You Grow</h2>
          <p className="section-subtitle">
            No hidden fees. Cancel anytime. Credits reset monthly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">{PLANS.FREE.name}</h3>
                <p className="text-gray-400 text-sm">No credit card required</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-display font-bold">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {PLANS.FREE.credits} video credits per month
              </p>
            </div>

            <Link href="/auth/register" className="btn-secondary w-full text-center block mb-8">
              Get Started Free
            </Link>

            <ul className="space-y-3">
              {PLANS.FREE.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
              {PLANS.FREE.limitations.map((l) => (
                <li key={l} className="flex items-start gap-2.5 text-sm text-gray-500">
                  <X className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                  {l}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative glass-card p-8 border-brand-600 shadow-glow-md"
          >
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="badge bg-brand-600 text-white px-4 py-1.5 text-sm font-semibold shadow-glow-sm">
                Most Popular
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center animate-pulse-glow">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">{PLANS.PRO.name}</h3>
                <p className="text-gray-400 text-sm">Full production pipeline</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-display font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
                  ${PLANS.PRO.price}
                </span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {PLANS.PRO.credits} video credits/month · resets on billing date
              </p>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-8 text-base"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
              ) : (
                <><Crown className="w-4 h-4" /> Upgrade to Pro</>
              )}
            </button>

            <ul className="space-y-3">
              {PLANS.PRO.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* FAQ teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-sm">
            Questions? <a href="mailto:hello@docuai.com" className="text-brand-400 hover:text-brand-300">Contact us</a> · Credits never roll over · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
