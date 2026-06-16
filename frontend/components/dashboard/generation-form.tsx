"use client";

import { FormEvent, useMemo, useState } from "react";

import { generateStory } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { GenerateStoryResponse } from "@/lib/types";

export function GenerationForm() {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("cinematic documentary");
  const [targetMinutes, setTargetMinutes] = useState(8);
  const [isSubmitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GenerateStoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sceneCount = useMemo(() => result?.scenes.length ?? 0, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to generate documentaries.");
      }
      const response = await generateStory(session.access_token, {
        topic,
        language,
        tone,
        target_minutes: targetMinutes,
      });
      setResult(response);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unexpected generation error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
      <h2 className="text-xl font-semibold">Generate New Documentary Storyboard</h2>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm text-slate-200">
          Topic
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            required
            minLength={5}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="e.g. Fall of Constantinople"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-200">
            Script language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="en">English (Llama 3.1)</option>
              <option value="hi">Hindi (Qwen 2.5)</option>
              <option value="ur">Urdu (Qwen 2.5)</option>
              <option value="roman-hi">Roman Hindi (Qwen 2.5)</option>
              <option value="roman-ur">Roman Urdu (Qwen 2.5)</option>
            </select>
          </label>
          <label className="block text-sm text-slate-200">
            Length (minutes)
            <input
              type="number"
              value={targetMinutes}
              onChange={(event) => setTargetMinutes(Number(event.target.value))}
              min={1}
              max={20}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm text-slate-200">
          Tone
          <input
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-blue-500 px-5 py-2 font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Generating..." : "Generate Story"}
        </button>
      </form>
      {error ? <p className="mt-4 rounded-lg bg-red-950/60 p-3 text-sm text-red-200">{error}</p> : null}
      {result ? (
        <div className="mt-6 rounded-xl border border-blue-400/30 bg-blue-950/20 p-4 text-sm">
          <p>
            Project <span className="font-semibold">{result.project_id}</span> queued with {sceneCount} scenes.
          </p>
          <p className="mt-1 text-slate-300">LLM used: {result.language_model}</p>
          <p className="mt-1 text-slate-300">Credits left: {result.video_credits_left}</p>
        </div>
      ) : null}
    </section>
  );
}
