"use client";

import { useState } from "react";
import { generateStory, type GenerateStoryResponse, type SupportedLanguage } from "@/lib/api";

export function GenerationForm({
  onGenerated
}: {
  onGenerated: (response: GenerateStoryResponse, token?: string) => void;
}) {
  const [topic, setTopic] = useState("The rise and fall of the Silk Road");
  const [language, setLanguage] = useState<SupportedLanguage>("english");
  const [duration, setDuration] = useState(8);
  const [tone, setTone] = useState("Mighty Monk meets Vox: cinematic, factual, suspenseful");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await generateStory({
        topic,
        language,
        target_duration_minutes: duration,
        tone,
        fallbackToken: token || undefined
      });
      onGenerated(response, token || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Documentary topic</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold"
          />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Language/script</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold"
            >
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="urdu">Urdu</option>
              <option value="roman">Roman Urdu/Hindi</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Duration minutes</span>
            <input
              type="number"
              min={1}
              max={45}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold"
            />
          </label>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Tone and retention style</span>
          <textarea
            value={tone}
            onChange={(event) => setTone(event.target.value)}
            rows={3}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-300">Bearer token fallback</span>
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Optional Supabase JWT for local testing"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-gold"
          />
        </label>
        {error ? <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}
        <button
          disabled={loading}
          className="rounded-full bg-gold px-6 py-3 font-bold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Generating story plan..." : "Generate documentary"}
        </button>
      </div>
    </form>
  );
}
