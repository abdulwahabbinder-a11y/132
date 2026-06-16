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
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/login"; return; }
      api.setToken(session.access_token);
      try {
        const shorts = await api.listShortJobs();
        setProjects(shorts.map((j) => ({
          job_id: j.job_id,
          topic: j.topic,
          status: j.status,
          phase: j.phase,
          progress: j.progress,
          output_url: j.output_url,
          created_at: j.created_at,
        })));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

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
              <div key={p.job_id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  {statusIcon(p.status)}
                  <div>
                    <p className="text-sm font-medium">{p.topic}</p>
                    <p className="text-xs text-white/40">
                      {p.phase.replace(/_/g, " ")} · {p.progress}%
                      {p.created_at && ` · ${new Date(p.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.output_url && (
                    <a href={p.output_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
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
