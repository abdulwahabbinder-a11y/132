"use client";

import { useState } from "react";
import { env } from "@/lib/env";
import { getSupabaseClient } from "@/lib/supabase";
import type { GenerateStoryResponse, LanguageCode } from "@/lib/types";

type Props = {
  onGenerated: (response: GenerateStoryResponse) => void;
};

export function StoryGeneratorForm({ onGenerated }: Props) {
  const [topic, setTopic] = useState("The rise and fall of the Silk Road");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [duration, setDuration] = useState(8);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setIsSubmitting(true);
    setStatus("Checking your session and video credits...");
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Supabase is not configured.");
      setIsSubmitting(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setStatus("Please sign in before generating a documentary.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch(`${env.apiBaseUrl}/api/generate-story`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        topic,
        language,
        target_duration_minutes: duration,
        tone: "premium chronological documentary with strong retention hooks"
      })
    });

    const payload = await response.json();
    setIsSubmitting(false);
    if (!response.ok) {
      setStatus(payload.detail ?? "Generation failed.");
      return;
    }
    onGenerated(payload);
    setStatus(`Generation ${payload.generation_id} queued. Credits left: ${payload.credits_left}.`);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-signal">Story engine</p>
        <h2 className="mt-3 text-2xl font-semibold">Generate a chronological JSON script</h2>
        <p className="mt-2 text-sm text-slate-300">
          English routes to Llama 3.1; Hindi, Urdu, and Roman Urdu route to Qwen 2.5.
        </p>
      </div>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Documentary topic</span>
          <textarea
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="min-h-28 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-signal/40 transition focus:ring-4"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Language/script</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as LanguageCode)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-signal/40 transition focus:ring-4"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ur">Urdu</option>
              <option value="roman-urdu">Roman Urdu</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Target minutes</span>
            <input
              value={duration}
              min={1}
              max={60}
              type="number"
              onChange={(event) => setDuration(Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none ring-signal/40 transition focus:ring-4"
            />
          </label>
        </div>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={isSubmitting || topic.length < 3}
        className="mt-6 rounded-2xl bg-signal px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Generating..." : "Generate documentary"}
      </button>
      {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}
    </div>
  );
}
