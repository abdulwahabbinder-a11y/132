"use client";

import { useMemo, useState } from "react";
import {
  Crown,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  User,
  Users,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { videosFromCredits } from "@/lib/credits";
import type { AdminUserRow, AdminUsersSummary } from "@/lib/admin/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-white/45">{label}</span>
        <div className={cn("rounded-lg p-1.5", accent)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

interface AdminUsersPanelProps {
  summary: AdminUsersSummary | null;
  users: AdminUserRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isDemo?: boolean;
}

export function AdminUsersPanel({
  summary,
  users,
  loading,
  error,
  onRefresh,
  isDemo,
}: AdminUsersPanelProps) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (planFilter !== "all" && u.plan_type !== planFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q)
      );
    });
  }, [users, search, planFilter]);

  if (loading && !users.length) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isDemo && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Demo data — connect Supabase to see real signups and usage.
        </p>
      )}

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Users"
            value={summary.total_users}
            sub={`${summary.pro_users} Pro · ${summary.free_users} Free`}
            icon={Users}
            accent="bg-violet-500/15 text-violet-400"
          />
          <SummaryCard
            label="Pro Subscribers"
            value={summary.pro_users}
            sub="$29/mo plan"
            icon={Crown}
            accent="bg-amber-500/15 text-amber-400"
          />
          <SummaryCard
            label="Videos Rendered"
            value={summary.total_videos_completed}
            sub={`${summary.credits_per_video} credits each`}
            icon={Video}
            accent="bg-emerald-500/15 text-emerald-400"
          />
          <SummaryCard
            label="Free Users"
            value={summary.free_users}
            sub="5 credits on signup"
            icon={User}
            accent="bg-blue-500/15 text-blue-400"
          />
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold text-white/80">All Users</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                placeholder="Search email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-white/25 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div className="flex rounded-lg border border-white/10 p-0.5">
              {(["all", "pro", "free"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlanFilter(p)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition",
                    planFilter === p
                      ? "bg-violet-600/30 text-violet-200"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <p className="border-b border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs text-white/40">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-3 py-3 font-medium">Plan</th>
                <th className="px-3 py-3 font-medium">Signed Up</th>
                <th className="px-3 py-3 font-medium">Credits</th>
                <th className="px-3 py-3 font-medium">Usage</th>
                <th className="px-3 py-3 font-medium">Videos</th>
                <th className="px-5 py-3 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-white/30">
                    No users match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.user_id}
                    className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
                          {(u.full_name || u.email)[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 font-medium text-white/90">
                            {u.full_name}
                            {u.is_admin && (
                              <span title="Admin">
                                <Shield className="h-3 w-3 text-violet-400" aria-hidden />
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-white/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                          u.plan_type === "pro"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-white/10 text-white/50"
                        )}
                      >
                        {u.plan_type === "pro" && <Crown className="h-3 w-3" />}
                        {u.plan_type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-white/50">
                      {formatDate(u.signed_up_at)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-white/80">
                        {u.credits_remaining} left
                      </p>
                      <p className="text-[10px] text-white/35">
                        ~{u.credits_used_estimate} used · {videosFromCredits(u.credits_remaining)} videos left
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-white/50">
                      <span className="text-green-400">{u.videos_completed} done</span>
                      {u.jobs_in_progress > 0 && (
                        <span className="text-violet-400"> · {u.jobs_in_progress} active</span>
                      )}
                      {u.jobs_failed > 0 && (
                        <span className="text-red-400"> · {u.jobs_failed} failed</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-white/50">
                      {u.shorts_completed} shorts
                      <br />
                      {u.documentary_completed} docs
                    </td>
                    <td className="px-5 py-3 text-xs text-white/40">
                      {formatRelative(u.last_active_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 text-xs text-white/30">
          Showing {filtered.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}
