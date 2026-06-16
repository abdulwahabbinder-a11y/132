"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Image,
  Loader2,
  Mic,
  Sparkles,
  Video,
  AlertCircle,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const FORMATS = [
  { id: "viral", label: "Viral Short", desc: "9:16 TikTok/Reels", duration: 60 },
  { id: "documentary", label: "Documentary", desc: "21:9 cinematic", duration: 300 },
  { id: "listicle", label: "Listicle", desc: "Top 10 style", duration: 180 },
];

const DURATIONS = [
  { value: 30, label: "30 sec" },
  { value: 60, label: "1 min" },
  { value: 90, label: "90 sec" },
];

const PHASES = [
  { id: "scraping", label: "Research", icon: Globe, color: "text-blue-400" },
  { id: "scripting", label: "Script", icon: FileText, color: "text-violet-400" },
  { id: "assets", label: "Assets", icon: Image, color: "text-amber-400" },
  { id: "rendering", label: "Render", icon: Video, color: "text-green-400" },
];

interface LogEntry {
  timestamp: string;
  phase: string;
  message: string;
  progress: number;
  level: string;
}

export function CreateStudio() {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState("viral");
  const [duration, setDuration] = useState(60);
  const [jobId, setJobId] = useState<string | null>(null);
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!jobId) return;
    const poll = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      api.setToken(session.access_token);
      try {
        const job = await api.getShortJob(jobId);
        setPhase(job.phase);
        setProgress(job.progress);
        setLogs(job.logs);
        setOutputUrl(job.output_url);
        setError(job.error);
        if (job.status === "completed" || job.status === "failed") clearInterval(interval);
      } catch { /* keep polling */ }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setLogs([]);
    setOutputUrl(null);
    setJobId(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/login?redirect=/create"; return; }

      api.setToken(session.access_token);

      if (format === "documentary") {
        await api.generateStory({
          topic: prompt,
          language: "en",
          duration_minutes: Math.ceil(duration / 60),
          style: "vox",
        });
        setPhase("processing");
        setLogs([{ timestamp: new Date().toISOString(), phase: "queued", message: "Documentary generation started — check Dashboard for progress", progress: 5, level: "info" }]);
        return;
      }

      const result = await api.generateShort({
        topic: prompt,
        target_duration_seconds: duration,
      });
      setJobId(result.job_id);
      setPhase(result.phase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const isRunning = jobId && !["completed", "failed", "idle"].includes(phase);
  const currentPhaseIdx = PHASES.findIndex((p) => p.id === phase);

  if (jobId || phase === "processing") {
    return (
      <div className="mx-auto max-w-2xl px-8 py-12">
        {/* Progress view */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">
            {phase === "completed" ? "Your video is ready!" : "Creating your video..."}
          </h2>
          <p className="mt-1 text-sm text-white/50 truncate max-w-md mx-auto">{prompt}</p>
        </div>

        {/* Phase pills */}
        <div className="mb-6 flex justify-center gap-2">
          {PHASES.map((p, i) => {
            const Icon = p.icon;
            const done = currentPhaseIdx > i || phase === "completed";
            const active = currentPhaseIdx === i;
            return (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  done && "bg-green-500/10 text-green-400",
                  active && !done && "bg-violet-500/15 text-violet-300",
                  !done && !active && "bg-white/5 text-white/30"
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                {p.label}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-white/40">{progress}% complete</p>
        </div>

        {/* Logs */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-white/40">
            {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />}
            Pipeline activity
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto font-mono text-xs">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "rounded px-2 py-1",
                    log.level === "error" && "text-red-400",
                    log.level === "warn" && "text-yellow-400",
                    log.level === "success" && "text-green-400",
                    log.level === "info" && "text-white/60"
                  )}
                >
                  <span className="text-white/25">[{log.phase}]</span> {log.message}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={logEndRef} />
          </div>
        </div>

        {outputUrl && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
            <a href={outputUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-500">
              <Download className="h-4 w-4" /> Download Video
            </a>
            <button onClick={() => { setJobId(null); setPhase("idle"); setLogs([]); setOutputUrl(null); setProgress(0); }}
              className="mt-3 block w-full text-sm text-white/40 hover:text-white/70">
              Create another video
            </button>
          </motion.div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-8">
      {/* Vidrush-style centered prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">
          What video do you want to create?
        </h1>
        <p className="mb-8 text-center text-sm text-white/40">
          Describe your topic — we research, script, and render automatically
        </p>

        {/* Main prompt box */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-2xl shadow-violet-500/5 transition focus-within:border-violet-500/40 focus-within:shadow-violet-500/10">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. The secret history of Bitcoin — how it went from nothing to $1 trillion..."
            rows={4}
            className="w-full resize-none bg-transparent px-5 pt-5 pb-16 text-[15px] text-white placeholder:text-white/25 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
          />

          {/* Bottom controls inside prompt box */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              {/* Format selector */}
              <div className="flex gap-1">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setFormat(f.id); setDuration(f.duration); }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-medium transition",
                      format === f.id
                        ? "bg-violet-600/20 text-violet-300"
                        : "text-white/40 hover:text-white/70"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {format === "viral" && (
                <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                  <Clock className="h-3 w-3 text-white/30" />
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={cn(
                        "rounded px-2 py-0.5 text-[11px] transition",
                        duration === d.value ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-red-400">{error}</p>
        )}

        {/* Feature hints */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: Globe, label: "10+ scrapers", sub: "Tavily, Jina, Serper, Exa..." },
            { icon: Sparkles, label: "Claude + Llama", sub: "Deep research & scripting" },
            { icon: Mic, label: "ElevenLabs voice", sub: "Word-level subtitles" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-center">
              <Icon className="mx-auto mb-1.5 h-4 w-4 text-violet-400" />
              <p className="text-xs font-medium">{label}</p>
              <p className="text-[10px] text-white/30">{sub}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-white/25">
          ⌘ + Enter to generate · Multi-source research runs automatically
        </p>
      </motion.div>
    </div>
  );
}
