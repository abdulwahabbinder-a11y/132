"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ExternalLink,
  LogOut,
  RefreshCw,
  Shield,
} from "lucide-react";
import { SITE } from "@/lib/site";

interface AdminHeaderProps {
  isDemo: boolean;
  healthScore: number;
  onLogout: () => void;
  onRefresh?: () => void;
}

export function AdminHeader({
  isDemo,
  healthScore,
  onLogout,
  onRefresh,
}: AdminHeaderProps) {
  const healthColor =
    healthScore >= 80
      ? "text-green-400 bg-green-500/10 border-green-500/30"
      : healthScore >= 50
        ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
        : "text-red-400 bg-red-500/10 border-red-500/30";

  return (
    <div className="mb-8">
      {isDemo && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-200">Demo / Preview Mode</p>
            <p className="text-amber-200/70">
              Supabase is not connected. Changes save to browser storage only.
              Connect production DB for live config.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-400" />
            <h1 className="text-2xl font-bold tracking-tight">
              Admin Control Panel
            </h1>
          </div>
          <p className="max-w-2xl text-sm text-white/45">
            Manage scraping sources, Claude AI, media APIs, and billing.
            Changes propagate to workers within 60 seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${healthColor}`}
          >
            System Health {healthScore}%
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
          <Link
            href={SITE.url}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Site
          </Link>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
