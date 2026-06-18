"use client";

import Link from "next/link";
import { Crown, Zap } from "lucide-react";
import { CREDITS_PER_VIDEO, videosFromCredits } from "@/lib/credits";

interface SubscriptionCardProps {
  subscription: {
    plan_type: string;
    video_credits_left: number;
    billing_cycle_end: string | null;
  };
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const isPro = subscription.plan_type === "pro";

  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        {isPro ? (
          <Crown className="h-5 w-5 text-yellow-500" />
        ) : (
          <Zap className="h-5 w-5 text-brand-500" />
        )}
        <h2 className="text-lg font-semibold">
          {isPro ? "Pro Plan" : "Free Plan"}
        </h2>
      </div>

      <div className="mb-6">
        <p className="text-4xl font-bold">{subscription.video_credits_left}</p>
        <p className="text-sm text-white/50">
          credits · {videosFromCredits(subscription.video_credits_left)} video{videosFromCredits(subscription.video_credits_left) !== 1 ? "s" : ""} left
        </p>
        <p className="mt-1 text-xs text-white/35">{CREDITS_PER_VIDEO} credits per render</p>
      </div>

      {subscription.billing_cycle_end && (
        <p className="mb-4 text-sm text-white/50">
          Billing cycle ends:{" "}
          {new Date(subscription.billing_cycle_end).toLocaleDateString()}
        </p>
      )}

      {!isPro && (
        <Link
          href="/#pricing"
          className="btn-primary block w-full text-center text-sm"
        >
          Upgrade to Pro — $29/mo
        </Link>
      )}
    </div>
  );
}
