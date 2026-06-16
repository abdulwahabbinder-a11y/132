"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { VidrushShell } from "@/components/vidrush/VidrushShell";
import { Loader2, Download, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Project {
  job_id: string;
  topic: string;
  status: string;
  phase: string;
  progress: number;
  output_url: string | null;
  created_at: string | null;
  type: "short" | "documentary";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/auth/login?redirect=/projects";
        return;
      }
      api.setToken(session.access_token);
      try {
        const [shorts, docs] = await Promise.all([
          api.listShortJobs(),
          api.listJobs(),
        ]);

        const shortProjects: Project[] = shorts.map((j) => ({
          job_id: j.job_id,
          topic: j.topic,
          status: j.status,
          phase: j.phase,
          progress: j.progress,
          output_url: j.output_url,
          created_at: j.created_at,
          type: "short",
        }));

        const docProjects: Project[] = docs.map((j) => ({
          job_id: j.job_id,
          topic: `Documentary · ${j.status}`,
          status: j.status,
          phase: j.status,
          progress: j.progress,
          output_url: j.output_url,
          created_at: j.created_at,
          type: "documentary",
        }));

        const merged = [...shortProjects, ...docProjects].sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });

        setProjects(merged);
        setError(null);
      } catch {
        setError("Failed to load projects. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDownload = async (p: Project) => {
    setDownloadingId(p.job_id);
    try {
      if (p.type === "short") {
        await api.downloadShortVideo(p.job_id);
      } else {
        await api.downloadDocumentary(p.job_id);
      }
    } catch {
      setError("Download failed. The file may not be ready yet.");
    } finally {
      setDownloadingId(null);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />;
    return <Loader2 className="h-4 w-4 animate-spin text-violet-400" />;
  };

  return (
    <VidrushShell>
      <div className="mx-auto max-w-3xl px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-white/40">All your generated videos</p>
          </div>
          <Link href="/create" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500">
            + New Video
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-20 text-center">
            <p className="text-white/40">No projects yet</p>
            <Link href="/create" className="mt-3 inline-block text-sm text-violet-400 hover:text-violet-300">
              Create your first video →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={`${p.type}-${p.job_id}`}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  {statusIcon(p.status)}
                  <div>
                    <p className="text-sm font-medium">{p.topic}</p>
                    <p className="text-xs text-white/40">
                      {p.type === "short" ? "Viral short" : "Documentary"} ·{" "}
                      {p.phase.replace(/_/g, " ")} · {p.progress}%
                      {p.created_at && ` · ${new Date(p.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(p.output_url || p.status === "completed") && (
                    <button
                      onClick={() => handleDownload(p)}
                      disabled={downloadingId === p.job_id}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50"
                    >
                      {downloadingId === p.job_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download
                    </button>
                  )}
                  {p.status === "processing" && (
                    <span className="flex items-center gap-1 text-xs text-white/30">
                      <Clock className="h-3.5 w-3.5" /> Processing
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </VidrushShell>
  );
}
