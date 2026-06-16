"use client";

import { useEffect, useState } from "react";
import {
  getJobStatus,
  type GenerateStoryResponse,
  type JobStatusResponse
} from "@/lib/api";

export function JobStatusCard({
  initial,
  fallbackToken
}: {
  initial: GenerateStoryResponse | null;
  fallbackToken?: string;
}) {
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial?.job_id) {
      return;
    }
    let active = true;

    async function poll() {
      try {
        const status = await getJobStatus(initial!.job_id, fallbackToken);
        if (!active) {
          return;
        }
        setJob(status);
        if (["completed", "failed"].includes(status.status)) {
          return;
        }
        window.setTimeout(poll, 5000);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to poll job");
        }
      }
    }

    poll();
    return () => {
      active = false;
    };
  }, [initial, fallbackToken]);

  if (!initial) {
    return (
      <aside className="rounded-3xl border border-white/10 bg-black/30 p-6 text-slate-300">
        Generate a story to see scenes, asset processing, and render status.
      </aside>
    );
  }

  const scenes = job?.story_json ?? initial.scenes;
  const status = job?.status ?? initial.status;

  return (
    <aside className="rounded-3xl border border-white/10 bg-black/30 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-gold">Job {initial.job_id.slice(0, 8)}</p>
          <h2 className="mt-2 text-2xl font-bold">Pipeline status: {status}</h2>
        </div>
        <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-200">
          Credits left: {initial.credits_left}
        </span>
      </div>
      {error ? <p className="mt-4 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {job?.error_message ? (
        <p className="mt-4 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{job.error_message}</p>
      ) : null}
      {job?.final_video_url ? (
        <a
          href={job.final_video_url}
          className="mt-5 inline-flex rounded-full bg-gold px-5 py-3 font-bold text-ink"
        >
          Download final MP4
        </a>
      ) : null}
      <div className="mt-6 space-y-4">
        {scenes.map((scene) => (
          <article key={scene.scene_number} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Scene {scene.scene_number}</h3>
              <div className="flex gap-2 text-xs">
                {scene.is_abstract_scene ? <Badge>Abstract</Badge> : <Badge>Archival</Badge>}
                {scene.is_historical_character ? <Badge>Character</Badge> : null}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{scene.narration_text}</p>
            <p className="mt-3 text-xs text-slate-400">
              Keywords: {scene.visual_keywords.join(", ") || "not provided"}
            </p>
          </article>
        ))}
      </div>
    </aside>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-1 text-gold">
      {children}
    </span>
  );
}
