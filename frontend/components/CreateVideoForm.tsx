"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Wand2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Lang = "en" | "hi" | "ur" | "roman";

export function CreateVideoForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<Lang>("en");
  const [duration, setDuration] = useState(480);
  const [style, setStyle] = useState("cinematic-mighty-monk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.generateStory({
        topic,
        language,
        target_duration_seconds: duration,
        style,
      });
      router.push(`/dashboard/videos/${res.job_id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("You're out of credits. Upgrade to Pro for 30 monthly credits.");
      } else {
        setError(err instanceof Error ? err.message : "Generation failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass rounded-2xl p-8 space-y-6"
    >
      <div>
        <label className="text-sm text-white/70">Topic</label>
        <input
          required
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="The fall of Constantinople"
          className="mt-2 w-full bg-ink-800/80 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-white/70">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Lang)}
            className="mt-2 w-full bg-ink-800/80 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
          >
            <option value="en">English (Llama 3.1)</option>
            <option value="hi">Hindi (Qwen 2.5)</option>
            <option value="ur">Urdu (Qwen 2.5)</option>
            <option value="roman">Roman (Qwen 2.5)</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-white/70">Target length (s)</label>
          <input
            type="number"
            min={60}
            max={1800}
            step={30}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="mt-2 w-full bg-ink-800/80 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-sm text-white/70">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="mt-2 w-full bg-ink-800/80 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
          >
            <option value="cinematic-mighty-monk">Mighty Monk · cinematic</option>
            <option value="vox-explainer">Vox · explainer</option>
            <option value="nat-geo">Nat Geo · expedition</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-300 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading || !topic} className="btn-primary w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scripting via NIM…
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" /> Generate documentary
          </>
        )}
      </button>
    </motion.form>
  );
}
