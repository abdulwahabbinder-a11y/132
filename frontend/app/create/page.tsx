"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { VidrushShell } from "@/components/vidrush/VidrushShell";
import { CreateStudio } from "@/components/vidrush/CreateStudio";

export default function CreatePage() {
  const [credits, setCredits] = useState<number | undefined>();
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshCredits = useCallback(async () => {
    const { data: { session } } = await createClient().auth.getSession();
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
  }, []);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

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
