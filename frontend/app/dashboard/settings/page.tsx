"use client";

import useSWR from "swr";
import { CreditCard, LogOut } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { data: sub } = useSWR("subscription:me", () => api.mySubscription());

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function upgrade() {
    const { url } = await api.startCheckout();
    window.location.href = url;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <h1 className="text-3xl font-display font-bold">Settings</h1>

        <section className="glass rounded-2xl p-6 space-y-3">
          <h2 className="text-lg font-semibold">Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold uppercase tracking-wider">
                {sub?.plan_type ?? "—"}
              </div>
              <div className="text-sm text-white/60">
                {sub?.video_credits_left ?? "—"} credits remaining
              </div>
            </div>
            {sub?.plan_type !== "pro" && (
              <button onClick={upgrade} className="btn-primary">
                <CreditCard className="h-4 w-4 mr-2" /> Upgrade to Pro
              </button>
            )}
          </div>
          {sub?.billing_cycle_end && (
            <div className="text-xs text-white/50">
              Renews on {new Date(sub.billing_cycle_end).toLocaleDateString()}
            </div>
          )}
        </section>

        <section className="glass rounded-2xl p-6">
          <button onClick={logout} className="btn-ghost">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
}
