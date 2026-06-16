"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { generateStory, type LanguageOption, type StoryScene } from "@/lib/api";

const defaultPayload = {
  topic: "The rise and fall of the Library of Alexandria",
  language: "english" as LanguageOption,
  target_duration_seconds: 180,
  tone: "premium, cinematic, high-retention documentary",
};

export function GenerateStoryForm({
  accessToken,
}: {
  accessToken: string;
}) {
  const [payload, setPayload] = useState(defaultPayload);
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalScenes = useMemo(() => scenes.length, [scenes]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await generateStory(accessToken, payload);
        setScenes(response.scenes);
        setCreditsLeft(response.credits_left);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Unable to generate the story right now.",
        );
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.45)]"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-full bg-sky-400/15 p-2 text-sky-300">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-white">Generate a documentary storyline</h2>
            <p className="text-sm text-slate-300">
              Routes English to Llama 3.1 and Hindi/Urdu/Roman to Qwen 2.5.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-200">Topic</span>
            <textarea
              required
              rows={4}
              value={payload.topic}
              onChange={(event) => setPayload((current) => ({ ...current, topic: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none ring-0 transition focus:border-sky-400"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Language</span>
              <select
                value={payload.language}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    language: event.target.value as LanguageOption,
                  }))
                }
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-sky-400"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="urdu">Urdu</option>
                <option value="roman">Roman</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Duration (sec)</span>
              <input
                type="number"
                min={30}
                max={1800}
                value={payload.target_duration_seconds}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    target_duration_seconds: Number(event.target.value),
                  }))
                }
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-sky-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Tone</span>
              <input
                value={payload.tone}
                onChange={(event) => setPayload((current) => ({ ...current, tone: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-100 outline-none focus:border-sky-400"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Generate script and queue asset pipeline
          </button>
          {creditsLeft !== null ? (
            <p className="text-sm text-sky-200">Credits remaining after this request: {creditsLeft}</p>
          ) : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </form>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Scene blueprint</h3>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            {totalScenes} scenes
          </span>
        </div>
        <div className="space-y-3">
          {scenes.length === 0 ? (
            <p className="text-sm text-slate-400">
              Generate a project to preview the strict chronological JSON scene structure.
            </p>
          ) : (
            scenes.map((scene) => (
              <div key={scene.scene_number} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-sky-300">Scene {scene.scene_number}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {scene.is_abstract_scene ? "Abstract" : "Archival"}
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-200">{scene.narration_text}</p>
                <p className="mt-3 text-xs text-slate-400">
                  Keywords: {scene.visual_keywords.join(", ") || "None"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
