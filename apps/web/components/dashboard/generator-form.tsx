"use client";

import { useState } from "react";

import type { StoryGenerationRequest, StoryGenerationResponse, SupportedLanguage } from "@/lib/types";

interface GeneratorFormProps {
  disabled?: boolean;
  loading?: boolean;
  onGenerate: (payload: StoryGenerationRequest) => Promise<StoryGenerationResponse>;
}

const languages: SupportedLanguage[] = ["english", "hindi", "urdu", "roman-urdu", "roman"];

export function GeneratorForm({ disabled, loading, onGenerate }: GeneratorFormProps) {
  const [topic, setTopic] = useState("The rise and collapse of the Silk Road empires");
  const [language, setLanguage] = useState<SupportedLanguage>("english");
  const [duration, setDuration] = useState(180);
  const [tone, setTone] = useState("premium documentary");
  const [storyPreview, setStoryPreview] = useState<StoryGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form
        className="rounded-3xl border border-white/10 bg-white/5 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          try {
            const response = await onGenerate({
              topic,
              language,
              target_duration_seconds: duration,
              cinematic_tone: tone,
            });
            setStoryPreview(response);
          } catch (caughtError) {
            setError(
              caughtError instanceof Error ? caughtError.message : "Failed to generate story.",
            );
          }
        }}
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Story generator</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Create a documentary brief and dispatch the backend pipeline
            </h2>
          </div>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Topic</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Language</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                value={language}
                onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
              >
                {languages.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Duration (seconds)</span>
              <input
                type="number"
                min={60}
                max={900}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm text-slate-300">Cinematic tone</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
            />
          </label>
          {error ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={disabled || loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {loading ? "Generating..." : "Generate story + queue assets"}
          </button>
        </div>
      </form>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Scene preview</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Chronological JSON storyboard</h3>
          </div>
          {storyPreview ? (
            <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              Credits left: {storyPreview.remaining_credits}
            </div>
          ) : null}
        </div>
        <div className="mt-5 space-y-4">
          {storyPreview?.story?.length ? (
            storyPreview.story.map((scene) => (
              <article key={scene.scene_number} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                  <span>Scene {scene.scene_number}</span>
                  {scene.is_abstract_scene ? (
                    <span className="rounded-full bg-fuchsia-400/10 px-2 py-1 text-fuchsia-200">Abstract</span>
                  ) : null}
                  {scene.is_historical_character ? (
                    <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-cyan-200">
                      {scene.character_name || "Historical character"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">{scene.narration_text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {scene.visual_keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
              Generate a story to preview the ordered narration scenes, visual keywords, abstract
              flags, character routing, and coordinates that power the pipeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
