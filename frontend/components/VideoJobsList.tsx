"use client";

import Link from "next/link";
import useSWR from "swr";
import { Clapperboard, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  queued: "bg-white/10 text-white/70",
  scripting: "bg-blue-500/20 text-blue-300",
  scraping: "bg-cyan-500/20 text-cyan-300",
  generating_voice: "bg-fuchsia-500/20 text-fuchsia-300",
  character_render: "bg-purple-500/20 text-purple-300",
  assembling: "bg-amber-500/20 text-amber-300",
  encoding: "bg-orange-500/20 text-orange-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300",
};

export function VideoJobsList() {
  const { data, error, isLoading } = useSWR("videos:list", () => api.listJobs(), {
    refreshInterval: 5_000,
  });

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center gap-3 text-white/60">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your renders…
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-red-300">
        Could not load your jobs.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-white/60">
        <Clapperboard className="h-7 w-7 mx-auto text-accent" />
        <p className="mt-3">No renders yet — generate your first documentary above.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl divide-y divide-white/5">
      {data.map((job) => (
        <Link
          key={job.id}
          href={`/dashboard/videos/${job.id}`}
          className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
        >
          <div>
            <div className="font-medium">{job.topic}</div>
            <div className="text-xs text-white/50 mt-1">
              {new Date(job.created_at).toLocaleString()} · {job.language.toUpperCase()}
            </div>
          </div>
          <span
            className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded-full ${
              STATUS_COLOR[job.status] ?? "bg-white/10 text-white/70"
            }`}
          >
            {job.status.replace("_", " ")}
          </span>
        </Link>
      ))}
    </div>
  );
}
