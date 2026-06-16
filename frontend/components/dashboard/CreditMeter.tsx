"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Subscription } from "@/lib/api";

export const CreditMeter = ({ sub }: { sub: Subscription | undefined }) => {
  if (!sub) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="mt-3 h-2 w-full rounded bg-white/10" />
      </div>
    );
  }

  const max = sub.plan_type === "pro" ? 30 : 3;
  const pct = Math.max(0, Math.min(100, (sub.video_credits_left / max) * 100));

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Credits
          </div>
          <div className="mt-2 text-3xl font-bold">
            {sub.video_credits_left}{" "}
            <span className="text-base font-normal text-white/50">/ {max}</span>
          </div>
        </div>
        <div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              sub.plan_type === "pro"
                ? "bg-accent text-black"
                : "bg-white/10 text-white"
            }`}
          >
            {sub.plan_type.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-accent"
        />
      </div>

      {sub.plan_type === "free" && (
        <Link href="/pricing" className="btn-primary mt-5 w-full text-sm">
          Upgrade to Pro
        </Link>
      )}
    </div>
  );
};
