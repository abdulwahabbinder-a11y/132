"use client";

import Link from "next/link";
import { Clock, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Video } from "@/lib/api";

const statusStyles: Record<Video["status"], string> = {
  queued: "bg-white/10 text-white/70",
  scripting: "bg-blue-500/15 text-blue-300",
  scraping: "bg-purple-500/15 text-purple-300",
  rendering: "bg-amber-500/15 text-amber-300",
  composing: "bg-amber-500/15 text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  failed: "bg-red-500/15 text-red-300",
};

export const VideoCard = ({ video }: { video: Video }) => {
  const isInProgress = ["queued", "scripting", "scraping", "rendering", "composing"].includes(video.status);

  return (
    <Link href={`/dashboard/videos/${video.id}`} className="card block hover:border-accent/40">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="line-clamp-2 text-lg font-semibold">{video.topic}</h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
            <span className="uppercase tracking-wider">{video.language}</span>
            <span>·</span>
            <span>{new Date(video.created_at).toLocaleDateString()}</span>
            {video.duration_seconds ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.round(video.duration_seconds / 60)}m
                </span>
              </>
            ) : null}
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase ${statusStyles[video.status]}`}
        >
          {video.status}
        </span>
      </div>

      {isInProgress && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${video.progress_pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
            <Loader2 className="h-3 w-3 animate-spin" />
            {video.progress_pct}% — {video.status}
          </div>
        </div>
      )}

      {video.status === "completed" && video.output_url && (
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready
          </span>
          <a
            href={video.output_url}
            download
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Download MP4
          </a>
        </div>
      )}

      {video.status === "failed" && video.error_message && (
        <div className="mt-4 flex items-start gap-2 rounded bg-red-500/10 p-3 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{video.error_message}</span>
        </div>
      )}
    </Link>
  );
};
