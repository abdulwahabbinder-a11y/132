"use client";

import useSWR from "swr";
import { Zap } from "lucide-react";
import { api } from "@/lib/api";

export function CreditsBadge() {
  const { data, error } = useSWR("subscription:me", () => api.mySubscription(), {
    refreshInterval: 30_000,
  });

  if (error) return null;
  const credits = data?.video_credits_left ?? "—";
  const plan = data?.plan_type ?? "free";

  return (
    <div className="glass inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm">
      <Zap className="h-4 w-4 text-accent" />
      <span className="text-white/70">{plan.toUpperCase()}</span>
      <span className="text-white font-semibold">{credits} credits</span>
    </div>
  );
}
