"use client";

import { Coins } from "lucide-react";
import type { Subscription } from "@/lib/types";

export function CreditBadge({ sub }: { sub: Subscription | null }) {
  const credits = sub?.video_credits_left ?? 0;
  const plan = sub?.plan_type ?? "free";
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <Coins className="h-5 w-5 text-gold" />
      <div className="text-sm">
        <p className="font-semibold text-white">
          {credits} credit{credits === 1 ? "" : "s"} left
        </p>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          {plan} plan
        </p>
      </div>
    </div>
  );
}
