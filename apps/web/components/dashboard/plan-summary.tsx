import type { SubscriptionSummary } from "@/lib/types";

interface PlanSummaryProps {
  subscription: SubscriptionSummary | null;
}

export function PlanSummary({ subscription }: PlanSummaryProps) {
  if (!subscription) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
        Sign in with Supabase to load your plan, billing cycle, and remaining credits.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Subscription</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-slate-400">Plan</p>
          <p className="mt-2 text-2xl font-semibold text-white capitalize">{subscription.plan_type}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-slate-400">Credits left</p>
          <p className="mt-2 text-2xl font-semibold text-white">{subscription.video_credits_left}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm text-slate-400">Cycle ends</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {subscription.billing_cycle_end
              ? new Date(subscription.billing_cycle_end).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
