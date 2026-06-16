"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getDemoSession } from "@/lib/demo-auth";
import { DEMO_USER_SUBSCRIPTION } from "@/lib/demo-data";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { VidrushShell } from "@/components/vidrush/VidrushShell";
import { CreateStudio } from "@/components/vidrush/CreateStudio";

export default function CreatePage() {
  const [credits, setCredits] = useState<number | undefined>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const { session, loading: authLoading } = useSupabaseSession();

  const refreshCredits = useCallback(async () => {
    const demoSession = getDemoSession();
    if (demoSession) {
      setCredits(
        demoSession.role === "admin"
          ? 25
          : DEMO_USER_SUBSCRIPTION.video_credits_left
      );
      setLoadError(null);
      return;
    }

    if (!session) {
      window.location.href = "/auth/login?redirect=/create";
      return;
    }

    api.setToken(session.access_token);
    try {
      const sub = await api.getSubscription();
      setCredits(sub.video_credits_left);
      setLoadError(null);
    } catch {
      setLoadError("Could not load credits. Refresh the page.");
    }
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    refreshCredits();
  }, [authLoading, refreshCredits]);

  return (
    <VidrushShell credits={credits}>
      {loadError && (
        <div className="mx-auto max-w-2xl px-8 pt-4">
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {loadError}
          </p>
        </div>
      )}
      <CreateStudio creditsLeft={credits} onCreditsChange={refreshCredits} />
    </VidrushShell>
  );
}
