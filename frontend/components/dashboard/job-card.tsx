"use client";

import { useEffect, useState } from "react";
import { fetchJobStatus } from "@/lib/api";

type Props = {
  jobId: string | null;
  creditsLeft: number | null;
};

export function JobCard({ jobId, creditsLeft }: Props) {
  const [status, setStatus] = useState<string>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const timer = setInterval(async () => {
      const data = await fetchJobStatus(jobId);
      setStatus(data.status);
      setVideoUrl(data.output_video_url ?? null);
      setErrorMessage(data.error_message ?? null);
    }, 6000);
    return () => clearInterval(timer);
  }, [jobId]);

  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-lg font-medium">Current Job</h2>
      <p className="mt-2 text-sm text-slate-300">Job ID: {jobId ?? "—"}</p>
      <p className="mt-1 text-sm text-slate-300">Status: {status}</p>
      <p className="mt-1 text-sm text-slate-300">Credits Left: {creditsLeft ?? "—"}</p>
      {videoUrl ? (
        <a href={videoUrl} className="mt-4 inline-block text-sm text-violet-300 underline">
          Download rendered 21:9 video
        </a>
      ) : null}
      {errorMessage ? <p className="mt-3 text-sm text-red-300">{errorMessage}</p> : null}
    </aside>
  );
}
