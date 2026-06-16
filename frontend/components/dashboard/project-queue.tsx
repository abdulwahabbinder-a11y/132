"use client";

import { useEffect, useState } from "react";

import { listProjects } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Project } from "@/lib/types";

export function ProjectQueue() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return;
      }
      const data = await listProjects(session.access_token);
      if (isMounted) {
        setProjects(data);
      }
    };
    run().catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
      <h2 className="text-xl font-semibold">Render Queue</h2>
      <div className="mt-4 space-y-3">
        {projects.length === 0 ? <p className="text-sm text-slate-300">No projects yet.</p> : null}
        {projects.map((project) => (
          <article key={project.id} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm">
            <p className="font-medium">{project.topic}</p>
            <p className="mt-1 text-slate-300">Status: {project.status}</p>
            <p className="mt-1 text-xs text-slate-400">{new Date(project.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
