"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Download, Loader2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { isDemoUserSession } from "@/lib/demo-auth";
import { DEMO_USER_JOBS } from "@/lib/demo-data";

interface Job {
  job_id: string;
  status: string;
  progress: number;
  output_url: string | null;
  error: string | null;
  created_at: string | null;
}

interface JobListProps {
  refreshKey: number;
  demoMode?: boolean;
}

export function JobList({ refreshKey, demoMode }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (demoMode || isDemoUserSession()) {
        setJobs(DEMO_USER_JOBS);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      api.setToken(session.access_token);
      try {
        const data = await api.listJobs();
        setJobs(data);
      } catch {
        console.error("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }
    load();

    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [refreshKey, demoMode]);

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === "failed") return <XCircle className="h-5 w-5 text-red-500" />;
    if (status === "story_generated" || status.startsWith("processing"))
      return <Loader2 className="h-5 w-5 animate-spin text-brand-500" />;
    return <Clock className="h-5 w-5 text-white/40" />;
  };

  return (
    <div className="card">
      <h2 className="mb-6 text-xl font-semibold">Recent Jobs</h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="py-8 text-center text-white/40">
          No documentaries generated yet. Create your first one above!
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {statusIcon(job.status)}
                <div>
                  <p className="text-sm font-medium">
                    {job.job_id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-white/40">
                    {job.status.replace(/_/g, " ")} — {job.progress}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {job.output_url && (
                  <a
                    href={job.output_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                )}
                {job.error && (
                  <span className="text-xs text-red-400">{job.error.slice(0, 50)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
