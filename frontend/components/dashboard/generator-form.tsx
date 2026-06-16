"use client";

import { FormEvent, useState } from "react";
import { createStory } from "@/lib/api";
import { GenerateStoryResponse } from "@/lib/types";

const languageOptions = ["english", "hindi", "urdu", "roman"];

type Props = {
  onGenerated: (data: GenerateStoryResponse) => void;
};

export function GeneratorForm({ onGenerated }: Props) {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("english");
  const [duration, setDuration] = useState(240);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await createStory({
        topic,
        language,
        target_duration_seconds: duration
      });
      onGenerated(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate story.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <h2 className="text-lg font-medium">Start New Documentary Job</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-300">Topic</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-violet-500"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Rise of the Ottoman Empire"
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-300">Language</span>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-300">Duration (seconds)</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            type="number"
            min={30}
            max={1800}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Story & Queue Render"}
      </button>
    </form>
  );
}
