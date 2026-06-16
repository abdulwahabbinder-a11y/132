import type { JobResponse } from "@/lib/types";

interface JobsPanelProps {
  jobs: JobResponse[];
}

export function JobsPanel({ jobs }: JobsPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Render queue</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Recent documentary jobs</h2>
        </div>
        <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
          {jobs.length} tracked
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {jobs.length ? (
          jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-medium text-white">{job.topic}</p>
                  <p className="text-sm text-slate-400">
                    {job.language} · {job.story_json.story.length} scenes
                  </p>
                </div>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
                  {job.status.replaceAll("_", " ")}
                </span>
              </div>
              {job.render_url ? (
                <a
                  href={job.render_url}
                  className="mt-4 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  Open render output
                </a>
              ) : null}
              {job.error_message ? (
                <p className="mt-4 text-sm text-rose-200">{job.error_message}</p>
              ) : null}
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
            No generations yet. The queue will show asset gathering, narration, animation, and
            render progress after the first job starts.
          </div>
        )}
      </div>
    </div>
  );
}
