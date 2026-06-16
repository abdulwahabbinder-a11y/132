"use client";

import { useEffect, useState } from "react";
import { Film, Layers3, Map, Mic2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { GenerateStoryResponse, StoryScene } from "@/lib/types";
import { SceneTimeline } from "./SceneTimeline";
import { StoryGeneratorForm } from "./StoryGeneratorForm";

const pipelineSteps = [
  { icon: Layers3, label: "Facts and public media", detail: "Wikipedia, Wikidata, Commons, Internet Archive, Pexels, Pixabay" },
  { icon: Mic2, label: "Voice and timestamps", detail: "ElevenLabs MP3 plus word-level subtitle timing" },
  { icon: Film, label: "Character cinematics", detail: "Wan2.1, LivePortrait, and DeepVideo-V1" },
  { icon: Map, label: "Remotion assembly", detail: "Motion.dev transitions, Mapbox sequences, FFmpeg ducking" }
];

export function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerateStoryResponse | null>(null);
  const scenes: StoryScene[] = generation?.scenes ?? [];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-brass">Dashboard</p>
          <h2 className="mt-3 text-3xl font-semibold">Documentary command center</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {email
              ? `Signed in as ${email}. Launch a story job and the backend queues the complete production pipeline.`
              : "Sign in above to attach generation jobs to your Supabase user and subscription credits."}
          </p>
        </div>
        <StoryGeneratorForm onGenerated={setGeneration} />
        <div className="grid gap-3">
          {pipelineSteps.map((step) => (
            <div key={step.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex gap-3">
                <step.icon className="h-5 w-5 text-signal" />
                <div>
                  <h3 className="font-medium">{step.label}</h3>
                  <p className="mt-1 text-sm text-slate-400">{step.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SceneTimeline scenes={scenes} />
    </section>
  );
}
