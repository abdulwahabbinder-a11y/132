"use client";

import { CheckCircle2, AlertTriangle, Loader2, Film } from "lucide-react";
import type { JobStatus, VideoJob } from "@/lib/types";

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: "Queued",
  scripting: "Writing script",
  scraping: "Sourcing media",
  voicing: "Recording narration",
  animating: "Animating scenes",
  assembling: "Assembling timeline",
  rendering: "Rendering video",
  completed: "Completed",
  failed: "Failed",
};

export function JobCard({ job }: { job: VideoJob }) {
  const done = job.status === "completed";
  const failed = job.status === "failed";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{job.topic}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {job.language}
          </p>
        </div>
        <StatusIcon status={job.status} />
      </div>

      {!done && !failed && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {STATUS_LABEL[job.status]} · {job.progress}%
          </p>
        </div>
      )}

      {failed && (
        <p className="mt-3 text-sm text-red-400">
          {job.error_message ?? "Generation failed. Your credit was refunded."}
        </p>
      )}

      {done && job.output_url && (
        <a
          href={job.output_url}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost mt-4 w-full"
        >
          <Film className="h-4 w-4" /> Watch / download
        </a>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: JobStatus }) {
  if (status === "completed")
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />;
  if (status === "failed")
    return <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />;
  return <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-400" />;
}
