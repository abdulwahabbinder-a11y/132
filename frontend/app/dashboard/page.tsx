"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { VideoGenerator } from "@/components/dashboard/VideoGenerator";
import { JobList } from "@/components/dashboard/JobList";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { Film, LogOut, Zap } from "lucide-react";

interface Subscription {
  plan_type: string;
  video_credits_left: number;
  billing_cycle_end: string | null;
}

export default function DashboardPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/auth/login";
        return;
      }

      api.setToken(session.access_token);
      try {
        const sub = await api.getSubscription();
        setSubscription(sub);
      } catch {
        console.error("Failed to load subscription");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleGenerated = () => {
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="border-b border-white/10 bg-surface-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-6 w-6 text-brand-500" />
            <span className="font-bold">DocuForge AI</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link href="/shorts/wizard" className="btn-primary gap-2 text-sm">
            <Zap className="h-4 w-4" />
            Viral Short Wizard
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <VideoGenerator
              creditsLeft={subscription?.video_credits_left ?? 0}
              onGenerated={handleGenerated}
            />
            <JobList refreshKey={refreshKey} />
          </div>
          <div>
            {subscription && <SubscriptionCard subscription={subscription} />}
          </div>
        </div>
      </main>
    </div>
  );
}
