"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { ViralShortWizard } from "@/components/shorts/ViralShortWizard";
import { Film, ArrowLeft } from "lucide-react";

export default function ShortsWizardPage() {
  const [ready, setReady] = useState(false);
  const [credits, setCredits] = useState<number | undefined>();

  const load = useCallback(async () => {
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) {
      window.location.href = "/auth/login?redirect=/shorts/wizard";
      return;
    }
    api.setToken(session.access_token);
    try {
      const sub = await api.getSubscription();
      setCredits(sub.video_credits_left);
    } catch {
      /* credits optional */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-5 w-5 text-brand-500" />
            <span className="font-bold">DocuForge AI</span>
          </Link>
        </div>
      </header>

      <main className="px-6 py-10">
        <ViralShortWizard creditsLeft={credits} />
      </main>
    </div>
  );
}
