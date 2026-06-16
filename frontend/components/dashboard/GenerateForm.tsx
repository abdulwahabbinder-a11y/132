"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

const TONES = [
  { id: "mighty_monk", label: "Mighty Monk — meditative, philosophical" },
  { id: "vox_explainer", label: "Vox — source-driven, rigorous" },
  { id: "investigative", label: "Investigative — sharp, urgent" },
  { id: "cinematic", label: "Cinematic — slow, atmospheric" },
];

const LANGUAGES = [
  { id: "english", label: "English (Llama 3.1)" },
  { id: "hindi", label: "Hindi (Qwen 2.5)" },
  { id: "urdu", label: "Urdu (Qwen 2.5)" },
  { id: "roman_hindi", label: "Roman Hindi (Qwen 2.5)" },
  { id: "roman_urdu", label: "Roman Urdu (Qwen 2.5)" },
];

export const GenerateForm = () => {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("english");
  const [tone, setTone] = useState("mighty_monk");
  const [duration, setDuration] = useState(420);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { video_id } = await api.generateStory({
        topic,
        language,
        tone,
        target_duration_seconds: duration,
      });
      router.push(`/dashboard/videos/${video_id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card flex flex-col gap-5">
      <div>
        <label className="block text-sm font-medium text-white/80">Topic</label>
        <textarea
          required
          rows={3}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. The rise and fall of the Silk Road"
          className="mt-2 w-full rounded-lg border border-white/10 bg-surfaceAlt p-3
                     text-white placeholder:text-white/30 focus:border-accent
                     focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-white/80">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-surfaceAlt
                       p-3 text-white focus:border-accent focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-surfaceAlt
                       p-3 text-white focus:border-accent focus:outline-none"
          >
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center justify-between text-sm font-medium text-white/80">
          Target duration
          <span className="text-white/60">{Math.round(duration / 60)} min</span>
        </label>
        <input
          type="range"
          min={120}
          max={1200}
          step={30}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value, 10))}
          className="mt-2 w-full accent-[--tw-color-accent]"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Scripting…" : "Generate documentary"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
};
