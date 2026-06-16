"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: video, error } = useSWR(
    params.id ? ["video", params.id] : null,
    () => api.getVideo(params.id),
    { refreshInterval: 5000 }
  );

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-red-400">Failed to load video.</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-12 text-white/70">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold">{video.topic}</h1>
      <p className="mt-2 text-sm text-white/60">
        {video.language.toUpperCase()} · created{" "}
        {new Date(video.created_at).toLocaleString()}
      </p>

      <div className="mt-8 aspect-[21/9] w-full overflow-hidden rounded-2xl bg-black">
        {video.status === "completed" && video.output_url ? (
          <video controls className="h-full w-full" src={video.output_url} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-white/70">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <div className="text-sm uppercase tracking-widest">{video.status}</div>
            <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${video.progress_pct}%` }}
              />
            </div>
            <div className="text-xs text-white/50">{video.progress_pct}%</div>
          </div>
        )}
      </div>

      {video.error_message && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {video.error_message}
        </div>
      )}
    </div>
  );
}
