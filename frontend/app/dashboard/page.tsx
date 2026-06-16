"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import type { Subscription, VideoJob } from "@/lib/types";
import { CreditBadge } from "@/components/dashboard/CreditBadge";
import { GenerateForm } from "@/components/dashboard/GenerateForm";
import { JobList } from "@/components/dashboard/JobList";

export default function DashboardPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [authed, setAuthed] = useState<boolean>(!supabase);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [s, j] = await Promise.all([
        api.getSubscription().catch(() => null),
        api.listVideos().catch(() => []),
      ]);
      setSub(s);
      setJobs(j);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setAuthed(!!data.session);
      });
    }
    refresh();
  }, [refresh]);

  // Poll while any job is in-flight.
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status !== "completed" && j.status !== "failed"
    );
    if (!hasActive) return;
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [jobs, refresh]);

  if (!authed) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl font-bold">Sign in to continue</h1>
        <p className="mt-2 max-w-md text-slate-400">
          You need an account to generate documentaries and track your credits.
        </p>
        <Link href="/login" className="btn-primary mt-6">
          Sign in / Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Your studio</h1>
          <p className="text-slate-400">
            Generate and manage your AI documentaries.
          </p>
        </div>
        <CreditBadge sub={sub} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[420px_1fr]">
        <GenerateForm onCreated={refresh} />
        <div>
          <h2 className="mb-4 font-display text-xl font-bold">
            Recent documentaries
          </h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <JobList jobs={jobs} />
          )}
        </div>
      </div>
    </div>
  );
}
