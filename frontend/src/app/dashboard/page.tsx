"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import type { Account, GenerateStoryResponse, VideoSummary } from "@/lib/types";
import { CreditsBadge } from "@/components/dashboard/CreditsBadge";
import { GeneratorForm } from "@/components/dashboard/GeneratorForm";
import { VideoCard } from "@/components/dashboard/VideoCard";

export default function DashboardPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [acc, vids] = await Promise.all([
      api.getAccount(),
      api.listVideos(),
    ]);
    setAccount(acc);
    setVideos(vids);
  }, []);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?next=/dashboard");
        return;
      }
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [router, refresh]);

  // Poll while any video is still rendering.
  useEffect(() => {
    const active = videos.some(
      (v) => v.status !== "completed" && v.status !== "failed"
    );
    if (!active) return;
    const id = setInterval(() => {
      api.listVideos().then(setVideos).catch(() => undefined);
    }, 5000);
    return () => clearInterval(id);
  }, [videos]);

  function handleGenerated(res: GenerateStoryResponse) {
    if (account) {
      setAccount({ ...account, video_credits_left: res.credits_left });
    }
    refresh().catch(() => undefined);
  }

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="animate-spin text-brand-400" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Studio</h1>
          <p className="text-sm text-white/50">
            {account?.email}
          </p>
        </div>
        <CreditsBadge account={account} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <GeneratorForm onGenerated={handleGenerated} />

        <section>
          <h2 className="text-lg font-semibold text-white">Your documentaries</h2>
          {videos.length === 0 ? (
            <div className="card mt-4 grid place-items-center p-12 text-center text-white/50">
              No documentaries yet. Generate your first one!
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
