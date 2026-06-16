"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { CREDITS_PER_VIDEO, videosFromCredits } from "@/lib/credits";

interface VideoGeneratorProps {
  creditsLeft: number;
  onGenerated: () => void;
}

export function VideoGenerator({ creditsLeft, onGenerated }: VideoGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("en");
  const [duration, setDuration] = useState(5);
  const [style, setStyle] = useState("vox");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creditsLeft < CREDITS_PER_VIDEO) {
      setError(`Not enough credits. Each video requires ${CREDITS_PER_VIDEO} credits. Please upgrade to Pro.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      api.setToken(session.access_token);
      const result = await api.generateStory({
        topic,
        language,
        duration_minutes: duration,
        style,
      });

      setSuccess(
        `Documentary generation started! Job ID: ${result.job_id}. Credits remaining: ${result.credits_remaining}`
      );
      setTopic("");
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-6 flex items-center gap-3">
        <Wand2 className="h-6 w-6 text-brand-500" />
        <h2 className="text-xl font-semibold">Generate Documentary</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-white/70">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The Fall of the Berlin Wall"
            required
            minLength={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm text-white/70">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ur">Urdu</option>
              <option value="roman">Roman Script</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/70">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-white/70">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-500 focus:outline-none"
            >
              <option value="vox">Vox</option>
              <option value="mighty_monk">Mighty Monk</option>
              <option value="bbc">BBC</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || creditsLeft < CREDITS_PER_VIDEO}
          className="btn-primary w-full gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Script...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              Generate Documentary ({videosFromCredits(creditsLeft)} video{videosFromCredits(creditsLeft) !== 1 ? "s" : ""} · {creditsLeft} credits)
            </>
          )}
        </button>
      </form>
    </div>
  );
}
