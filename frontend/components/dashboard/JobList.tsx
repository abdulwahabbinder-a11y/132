"use client";

import { Film } from "lucide-react";
import { JobCard } from "./JobCard";
import type { VideoJob } from "@/lib/types";

export function JobList({ jobs }: { jobs: VideoJob[] }) {
  if (jobs.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center p-12 text-center">
        <Film className="h-10 w-10 text-slate-600" />
        <p className="mt-4 font-medium text-slate-300">No documentaries yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Generate your first one to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
