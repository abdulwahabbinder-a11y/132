"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { VidrushShell } from "@/components/vidrush/VidrushShell";
import { CreateStudio } from "@/components/vidrush/CreateStudio";

export default function CreatePage() {
  const [credits, setCredits] = useState<number | undefined>();

  useEffect(() => {
    createClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/auth/login?redirect=/create"; return; }
      api.setToken(session.access_token);
      try {
        const sub = await api.getSubscription();
        setCredits(sub.video_credits_left);
      } catch { /* ignore */ }
    });
  }, []);

  return (
    <VidrushShell credits={credits}>
      <CreateStudio />
    </VidrushShell>
  );
}
