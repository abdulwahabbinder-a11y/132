"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { GenerateStoryResponse, ScriptLanguage } from "@/lib/types";

const LANGUAGES: { value: ScriptLanguage; label: string; model: string }[] = [
  { value: "english", label: "English", model: "Llama 3.1 70B" },
  { value: "hindi", label: "Hindi", model: "Qwen 2.5 72B" },
  { value: "urdu", label: "Urdu", model: "Qwen 2.5 72B" },
  { value: "roman", label: "Roman", model: "Qwen 2.5 72B" },
];

export function GeneratorForm({
  onGenerated,
}: {
  onGenerated: (res: GenerateStoryResponse) => void;
}) {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<ScriptLanguage>("english");
  const [scenes, setScenes] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateStory({
        topic,
        language,
        target_scene_count: scenes,
      });
      onGenerated(res);
      setTopic("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("You're out of credits. Upgrade to Pro to keep creating.");
      } else {
        setError(err instanceof Error ? err.message : "Generation failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <h2 className="text-lg font-semibold text-white">New documentary</h2>
      <p className="mt-1 text-sm text-white/50">
        Describe a topic; the AI handles scripting, research, media and rendering.
      </p>

      <label className="mt-5 block text-xs font-medium uppercase tracking-wide text-white/40">
        Topic
      </label>
      <textarea
        required
        rows={3}
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. The rise and fall of the Library of Alexandria"
        className="input mt-2 resize-none"
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-white/40">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as ScriptLanguage)}
            className="input mt-2"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label} — {l.model}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-white/40">
            Scenes: {scenes}
          </label>
          <input
            type="range"
            min={4}
            max={40}
            value={scenes}
            onChange={(e) => setScenes(Number(e.target.value))}
            className="mt-4 w-full accent-brand-500"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || topic.trim().length < 3}
        className="btn-primary mt-6 w-full"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Generating script…
          </>
        ) : (
          <>
            <Wand2 size={18} /> Generate documentary
          </>
        )}
      </button>
    </form>
  );
}
