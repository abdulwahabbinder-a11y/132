"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { VideoCard } from "@/components/dashboard/VideoCard";
import { CreditMeter } from "@/components/dashboard/CreditMeter";

export default function DashboardPage() {
  const { data: sub } = useSWR("subscription", () => api.getSubscription());
  const { data: videos, isLoading } = useSWR(
    "videos",
    () => api.listVideos(),
    { refreshInterval: 10_000 }
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <CreditMeter sub={sub} />
        </aside>

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">Your documentaries</h1>
              <p className="mt-1 text-sm text-white/60">
                Videos auto-refresh as they progress through the pipeline.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="card h-40 animate-pulse" />
              ))}
            </div>
          ) : videos && videos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          ) : (
            <div className="card text-center text-white/60">
              No documentaries yet. Hit{" "}
              <a href="/generate" className="text-accent underline">
                New Documentary
              </a>{" "}
              to start your first cinematic.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
