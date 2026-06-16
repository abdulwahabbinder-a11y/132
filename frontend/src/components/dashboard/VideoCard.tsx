"use client";

import { CheckCircle2, Clock, Film, XCircle } from "lucide-react";
import type { VideoSummary } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  scripting: "Scripting",
  scraping: "Researching",
  generating_media: "Gathering media",
  synthesising: "Voicing",
  assembling: "Assembling",
  rendering: "Rendering",
  completed: "Completed",
  failed: "Failed",
};

export function VideoCard({ video }: { video: VideoSummary }) {
  const done = video.status === "completed";
  const failed = video.status === "failed";

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-white line-clamp-2">{video.topic}</h3>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            done
              ? "bg-emerald-500/15 text-emerald-300"
              : failed
                ? "bg-red-500/15 text-red-300"
                : "bg-brand-500/15 text-brand-400"
          }`}
        >
          {done ? (
            <CheckCircle2 size={13} />
          ) : failed ? (
            <XCircle size={13} />
          ) : (
            <Clock size={13} />
          )}
          {STATUS_LABEL[video.status] ?? video.status}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-white/40">
        <span className="uppercase">{video.language}</span>
        {video.created_at && (
          <span>{new Date(video.created_at).toLocaleDateString()}</span>
        )}
      </div>

      {!done && !failed && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${video.progress}%` }}
          />
        </div>
      )}

      {done && video.output_url && (
        <a
          href={video.output_url}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost mt-1 w-full"
        >
          <Film size={16} /> Watch / download
        </a>
      )}
    </div>
  );
}
