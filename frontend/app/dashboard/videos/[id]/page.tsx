"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";

export default function VideoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, error } = useSWR(
    id ? `video:${id}` : null,
    () => api.getJob(id as string),
    { refreshInterval: 4000 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!data && !error ? (
          <div className="flex items-center gap-3 text-white/60">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading job…
          </div>
        ) : error ? (
          <div className="text-red-300">Could not load this job.</div>
        ) : data ? (
          <>
            <header>
              <h1 className="text-3xl font-display font-bold">{data.topic}</h1>
              <div className="mt-2 text-sm text-white/60">
                {data.language.toUpperCase()} · Status:{" "}
                <span className="text-accent font-medium uppercase tracking-wider">
                  {data.status.replace("_", " ")}
                </span>
              </div>
            </header>

            {data.output_url ? (
              <video
                src={data.output_url}
                controls
                className="w-full aspect-[21/9] rounded-2xl border border-white/10 bg-black"
              />
            ) : (
              <div className="glass rounded-2xl p-12 text-center text-white/60">
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-accent" />
                <p className="mt-3">
                  Pipeline running. This page auto-refreshes — you'll see the cinematic preview here.
                </p>
              </div>
            )}

            {data.error_message ? (
              <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-4 text-red-300">
                {data.error_message}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
