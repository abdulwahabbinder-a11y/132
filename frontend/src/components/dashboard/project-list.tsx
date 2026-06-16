import { Film, Globe2, Video } from "lucide-react";

import type { DashboardPayload } from "@/lib/api";

export function ProjectList({ projects }: { projects: DashboardPayload["recent_projects"] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full bg-indigo-400/15 p-2 text-indigo-300">
          <Film className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-white">Recent productions</h2>
          <p className="text-sm text-slate-300">
            Track projects as they move from script generation into media fetching and final render.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
            No productions yet. Generate a story to seed the asset pipeline and Remotion render queue.
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 lg:grid-cols-[1fr_auto_auto]"
            >
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">{project.topic}</h3>
                <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Globe2 className="h-3.5 w-3.5" />
                    {project.language}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Video className="h-3.5 w-3.5" />
                    {project.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-300">
                <div className="font-medium text-white">Created</div>
                <div>{new Date(project.created_at).toLocaleString()}</div>
              </div>

              <div className="text-sm text-slate-300">
                <div className="font-medium text-white">Output</div>
                {project.render_output_url ? (
                  <a href={project.render_output_url} className="text-sky-300 hover:text-sky-200">
                    View render
                  </a>
                ) : (
                  <span>Pending</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
