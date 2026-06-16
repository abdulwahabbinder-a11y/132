"use client";

import {
  Activity,
  Brain,
  CheckCircle2,
  Coins,
  CreditCard,
  Film,
  Globe,
  Key,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminStats } from "@/lib/admin/types";
import { CREDITS_CONFIG } from "@/lib/admin/utils";

interface AdminOverviewProps {
  stats: AdminStats;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Globe;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-white/45">{label}</span>
        <div className={cn("rounded-lg p-1.5", accent)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <XCircle className="h-4 w-4 text-white/25" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs text-white/40">{detail}</span>
    </div>
  );
}

export function AdminOverview({ stats }: AdminOverviewProps) {
  const { creditsPerVideo, freePlanCredits, freePlanVideos, proPlanCredits, proPlanVideos, proPlanPrice } =
    CREDITS_CONFIG;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="System Health"
          value={`${stats.healthScore}%`}
          sub="Based on keys, scrapers & services"
          icon={Activity}
          accent="bg-violet-500/15 text-violet-400"
        />
        <StatCard
          label="Scrapers Ready"
          value={`${stats.scrapersReady}/${stats.scrapersTotal}`}
          sub="Enabled with valid configuration"
          icon={Globe}
          accent="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="API Keys Set"
          value={`${stats.keysConfigured}/${stats.keysTotal}`}
          sub="Secret keys configured"
          icon={Key}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="Credits / Video"
          value={creditsPerVideo}
          sub={`Free: ${freePlanVideos} vid · Pro: ${proPlanVideos} vids`}
          icon={Coins}
          accent="bg-amber-500/15 text-amber-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/80">
            Service Status
          </h3>
          <div className="space-y-2">
            <StatusRow
              label="Research & Scraping"
              ok={stats.scrapersReady >= 2}
              detail={`${stats.scrapersReady} sources active`}
            />
            <StatusRow
              label="Claude / LLM"
              ok={stats.llmReady}
              detail={stats.llmReady ? "API key configured" : "Add Claude API key"}
            />
            <StatusRow
              label="Media & Voice"
              ok={stats.mediaReady}
              detail={stats.mediaReady ? "At least one media key set" : "Add ElevenLabs or Pexels"}
            />
            <StatusRow
              label="Stripe Billing"
              ok={stats.billingReady}
              detail={stats.billingReady ? "Payments ready" : "Add Stripe secret key"}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
            <CreditCard className="h-4 w-4 text-violet-400" />
            Plans & Credits
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Free Plan</span>
                <span className="text-xs text-white/40">$0/mo</span>
              </div>
              <p className="mt-1 text-xs text-white/45">
                {freePlanCredits} credits = {freePlanVideos} video on signup
              </p>
            </div>
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-violet-200">Pro Plan</span>
                <span className="text-xs text-violet-300/70">${proPlanPrice}/mo</span>
              </div>
              <p className="mt-1 text-xs text-white/45">
                {proPlanCredits} credits = {proPlanVideos} videos per month
              </p>
            </div>
            <p className="text-[11px] text-white/30">
              Rule: {creditsPerVideo} credits deducted per video render. Edit in backend config / migration 004.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-300">
          <Brain className="h-4 w-4" />
          Research Pipeline
        </h3>
        <p className="text-xs leading-relaxed text-white/50">
          Multiple scrapers gather sources →{" "}
          <strong className="text-white/70">Claude AI</strong> synthesizes a research brief →{" "}
          <strong className="text-white/70">Claude / Llama</strong> writes the viral script →{" "}
          <strong className="text-white/70">ElevenLabs + Pexels</strong> produce voice & visuals.
          Configure each stage in the tabs above.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Globe, title: "Scraping", desc: "Enable sources & add API keys", tab: "scraping" },
          { icon: Brain, title: "AI / LLM", desc: "Claude key & model routing", tab: "llm" },
          { icon: Film, title: "Media", desc: "Voice, stock footage, maps", tab: "media" },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <Icon className="mb-2 h-5 w-5 text-violet-400" />
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-0.5 text-xs text-white/40">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
