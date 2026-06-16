"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import type { Account } from "@/lib/types";

export function CreditsBadge({ account }: { account: Account | null }) {
  if (!account) return null;
  const isPro = account.plan_type === "pro";
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
          isPro
            ? "bg-amberglow/15 text-amberglow"
            : "bg-white/10 text-white/70"
        }`}
      >
        {isPro ? "PRO" : "FREE"}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1.5 text-xs font-semibold text-brand-400">
        <Zap size={14} />
        {account.video_credits_left} credits
      </span>
      {!isPro && (
        <Link href="/pricing" className="text-xs text-brand-400 hover:underline">
          Upgrade
        </Link>
      )}
    </div>
  );
}
