"use client";

import { useState } from "react";
import { GeneratorForm } from "@/components/dashboard/generator-form";
import { JobCard } from "@/components/dashboard/job-card";
import { GeneratedScene } from "@/lib/types";

export default function DashboardPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [scenes, setScenes] = useState<GeneratedScene[]>([]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Documentary Generator Dashboard</h1>
      <p className="mt-2 text-slate-400">
        Enter a topic, choose language routing, and launch full automated documentary production.
      </p>

      <GeneratorForm
        onGenerated={(data) => {
          setJobId(data.job_id);
          setCreditsLeft(data.credits_left);
          setScenes(data.scenes);
        }}
      />

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <JobCard jobId={jobId} creditsLeft={creditsLeft} />
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-medium">Chronological Scene Output</h2>
          <ul className="mt-3 space-y-3">
            {scenes.map((scene) => (
              <li key={scene.scene_number} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-sm text-violet-300">Scene {scene.scene_number}</p>
                <p className="mt-1 text-sm text-slate-200">{scene.narration_text}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Keywords: {scene.visual_keywords.join(", ")} | Coords: {scene.location_coordinates}
                </p>
              </li>
            ))}
            {scenes.length === 0 ? (
              <li className="text-sm text-slate-500">No scenes yet. Generate a story to preview output.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </main>
  );
}
