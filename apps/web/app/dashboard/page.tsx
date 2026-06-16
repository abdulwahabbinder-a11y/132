"use client";

import { useState } from "react";
import { GenerationForm } from "@/components/GenerationForm";
import { JobStatusCard } from "@/components/JobStatusCard";
import type { GenerateStoryResponse } from "@/lib/api";

export default function DashboardPage() {
  const [generated, setGenerated] = useState<GenerateStoryResponse | null>(null);
  const [fallbackToken, setFallbackToken] = useState<string | undefined>();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <section className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">
          Studio dashboard
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
          Build a complete documentary pipeline from a single prompt.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          The backend checks subscription credits, routes language-specific scripting,
          scrapes public sources, generates voice and character cinematics, and hands
          a scene graph to Remotion for assembly.
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GenerationForm
          onGenerated={(response, token) => {
            setGenerated(response);
            setFallbackToken(token);
          }}
        />
        <JobStatusCard initial={generated} fallbackToken={fallbackToken} />
      </div>
    </main>
  );
}
