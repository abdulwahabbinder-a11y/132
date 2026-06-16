"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, Sparkles, Globe, Film, Ratio, Hash, Loader2,
  ChevronDown, AlertCircle
} from "lucide-react";
import { generateStory, StoryRequest } from "@/lib/api";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  onClose: () => void;
}

const LANGUAGES = [
  { value: "en", label: "English (Llama 3.1 70B)" },
  { value: "hi", label: "Hindi (Qwen 2.5 72B)" },
  { value: "ur", label: "Urdu (Qwen 2.5 72B)" },
  { value: "ro", label: "Roman Urdu (Qwen 2.5 72B)" },
];

const STYLES = [
  { value: "documentary", label: "Documentary (BBC style)", desc: "Deep narrative, authoritative voice" },
  { value: "explainer", label: "Explainer (Vox style)", desc: "Clear, engaging, data-driven" },
  { value: "vox", label: "Story-Led (Mighty Monk)", desc: "Emotional, human-centered storytelling" },
];

const ASPECT_RATIOS = [
  { value: "21:9", label: "21:9 Cinematic", desc: "Ultra-wide, film quality" },
  { value: "16:9", label: "16:9 Widescreen", desc: "Standard YouTube / TV" },
  { value: "9:16", label: "9:16 Portrait", desc: "Shorts, Reels, TikTok" },
];

const SAMPLE_TOPICS = [
  "The Fall of the Roman Empire",
  "The Rise of Artificial Intelligence",
  "Partition of India 1947",
  "The Manhattan Project",
  "The Great Firewall of China",
  "Story of Nikola Tesla",
];

export function VideoGenerator({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState<StoryRequest["language"]>("en");
  const [style, setStyle] = useState<StoryRequest["style"]>("documentary");
  const [aspectRatio, setAspectRatio] = useState<StoryRequest["aspect_ratio"]>("21:9");
  const [numScenes, setNumScenes] = useState(8);

  const mutation = useMutation({
    mutationFn: generateStory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast.success(`"${data.title}" is generating! ${data.credits_remaining} credits left.`);
      onClose();
    },
    onError: (error: Error) => {
      if (error.message.includes("402")) {
        toast.error("No credits remaining. Please upgrade to Pro.");
      } else {
        toast.error(error.message || "Failed to generate story");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    mutation.mutate({ topic: topic.trim(), language, style, aspect_ratio: aspectRatio, num_scenes: numScenes });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl glass-card overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">New Documentary</h2>
              <p className="text-xs text-gray-400">Full AI pipeline will execute automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Documentary Topic *
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The assassination of Archduke Franz Ferdinand and its consequences"
              rows={3}
              className="input-field resize-none"
              required
            />
            {/* Sample topics */}
            <div className="flex flex-wrap gap-2 mt-3">
              {SAMPLE_TOPICS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTopic(t)}
                  className="text-xs px-2.5 py-1 glass-card hover:border-brand-600 transition-all rounded-lg text-gray-400 hover:text-white"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Globe className="inline w-4 h-4 mr-1.5 text-cyan-400" />
              Language & AI Model
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as StoryRequest["language"])}
                className="input-field appearance-none pr-10"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Film className="inline w-4 h-4 mr-1.5 text-purple-400" />
              Documentary Style
            </label>
            <div className="grid grid-cols-1 gap-2">
              {STYLES.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    style === s.value
                      ? "border-brand-500 bg-brand-600/10"
                      : "border-surface-border hover:border-surface-card bg-surface-card/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="style"
                    value={s.value}
                    checked={style === s.value}
                    onChange={() => setStyle(s.value as StoryRequest["style"])}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    style === s.value ? "border-brand-400" : "border-gray-600"
                  }`}>
                    {style === s.value && <div className="w-2 h-2 rounded-full bg-brand-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-gray-500">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Ratio className="inline w-4 h-4 mr-1.5 text-orange-400" />
              Output Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setAspectRatio(r.value as StoryRequest["aspect_ratio"])}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aspectRatio === r.value
                      ? "border-brand-500 bg-brand-600/10"
                      : "border-surface-border hover:border-surface-card"
                  }`}
                >
                  <div className="text-sm font-semibold font-mono">{r.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Number of scenes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Hash className="inline w-4 h-4 mr-1.5 text-yellow-400" />
              Number of Scenes: <span className="text-brand-400 font-bold">{numScenes}</span>
            </label>
            <input
              type="range"
              min={5}
              max={15}
              value={numScenes}
              onChange={(e) => setNumScenes(parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 scenes (~3 min)</span>
              <span>15 scenes (~10 min)</span>
            </div>
          </div>

          {/* Info banner */}
          <div className="glass-card bg-brand-600/5 border-brand-700/50 p-4 rounded-xl flex gap-3">
            <AlertCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Generating a documentary will use <strong className="text-white">1 credit</strong>.
              The pipeline runs in the background — Llama/Qwen scripting, media scraping,
              ElevenLabs TTS, Wan2.1 animation, and FFmpeg assembly. You&apos;ll be notified when complete.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !topic.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Script...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Documentary</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
