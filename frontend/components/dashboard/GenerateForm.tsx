"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Language } from "@/lib/types";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "english", label: "English (Llama 3.1)" },
  { value: "hindi", label: "Hindi (Qwen 2.5)" },
  { value: "urdu", label: "Urdu (Qwen 2.5)" },
  { value: "roman", label: "Roman / Hinglish (Qwen 2.5)" },
];

export function GenerateForm({ onCreated }: { onCreated: () => void }) {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<Language>("english");
  const [sceneCount, setSceneCount] = useState(12);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (topic.trim().length < 3) {
      setError("Please enter a topic (at least 3 characters).");
      return;
    }
    setSubmitting(true);
    try {
      await api.generateStory(topic.trim(), language, sceneCount);
      setTopic("");
      onCreated();
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        setError("You're out of credits. Upgrade to Pro to keep generating.");
      } else if (e instanceof ApiError && e.status === 401) {
        setError("Please sign in to generate a documentary.");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <h2 className="font-display text-xl font-bold">New documentary</h2>
      <p className="mt-1 text-sm text-slate-400">
        Describe a topic. We will script, source media, narrate, and render a
        21:9 cinematic video.
      </p>

      <label className="mt-5 block text-sm font-medium text-slate-300">
        Topic
      </label>
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. The rise and fall of the Library of Alexandria"
        className="mt-2 w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand-500"
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">
            Scenes: {sceneCount}
          </label>
          <input
            type="range"
            min={4}
            max={40}
            value={sceneCount}
            onChange={(e) => setSceneCount(Number(e.target.value))}
            className="mt-4 w-full accent-brand-500"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary mt-6 w-full"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
        Generate documentary
      </button>
    </form>
  );
}
