"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Download,
  Globe,
  Image,
  Loader2,
  Sparkles,
  Video,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { CREDITS_PER_VIDEO } from "@/lib/credits";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "scraping", label: "Web Scraping", icon: Globe, description: "Tavily + Jina live research" },
  { id: "scripting", label: "Script Generation", icon: Sparkles, description: "Llama 3.1 viral script" },
  { id: "assets", label: "Asset Generation", icon: Image, description: "Flux images + ElevenLabs audio" },
  { id: "rendering", label: "Rendering", icon: Video, description: "Remotion + FFmpeg 9:16 output" },
];

interface LogEntry {
  timestamp: string;
  phase: string;
  message: string;
  progress: number;
  level: string;
}

function phaseIndex(phase: string): number {
  const idx = PHASES.findIndex((p) => p.id === phase);
  return idx >= 0 ? idx : -1;
}

export function ViralShortWizard({ creditsLeft }: { creditsLeft?: number }) {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(60);
  const [jobId, setJobId] = useState<string | null>(null);
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const insufficientCredits =
    creditsLeft !== undefined && creditsLeft < CREDITS_PER_VIDEO;

  const resetWizard = () => {
    setJobId(null);
    setPhase("idle");
    setLogs([]);
    setOutputUrl(null);
    setProgress(0);
    setError(null);
  };

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

        if (job.status === "completed" || job.status === "failed") {
          clearInterval(interval);
        }
      } catch {
        // keep polling
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLogs([]);
    setOutputUrl(null);
    setJobId(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/auth/login?redirect=/shorts/wizard";
        return;
      }

      api.setToken(session.access_token);
      const result = await api.generateShort({
        topic,
        target_duration_seconds: duration,
      });

      setJobId(result.job_id);
      setPhase(result.phase);
      setLogs([{
        timestamp: new Date().toISOString(),
        phase: "queued",
        message: result.message,
        progress: 0,
        level: "info",
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!jobId) return;
    setDownloading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      api.setToken(session.access_token);
      await api.downloadShortVideo(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const currentPhaseIdx = phaseIndex(phase);
  const isRunning = jobId && !["completed", "failed", "idle"].includes(phase);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Wizard Header */}
      <div className="mb-8 text-center">
        <span className="mb-3 inline-block rounded-full bg-brand-500/10 px-4 py-1 text-sm font-medium text-brand-500">
          Vidrush AI Clone
        </span>
        <h1 className="text-3xl font-bold">Viral Short Video Wizard</h1>
        <p className="mt-2 text-white/60">
          Live web scraping → Llama 3.1 script → Flux + ElevenLabs → 9:16 render
        </p>
      </div>

      {/* Phase Progress Tracker */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PHASES.map((p, i) => {
          const Icon = p.icon;
          const isDone = currentPhaseIdx > i || phase === "completed";
          const isActive = currentPhaseIdx === i || (phase === p.id);
          const isPending = currentPhaseIdx < i && phase !== "completed";

          return (
            <motion.div
              key={p.id}
              animate={{ scale: isActive ? 1.02 : 1 }}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                isDone && "border-green-500/40 bg-green-500/5",
                isActive && !isDone && "border-brand-500/60 bg-brand-500/10",
                isPending && "border-white/10 bg-white/5 opacity-50"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                ) : (
                  <Circle className="h-5 w-5 text-white/30" />
                )}
                <Icon className="h-4 w-4 text-white/60" />
              </div>
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="text-xs text-white/40">{p.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Bar */}
      {jobId && (
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-white/60">Overall progress</span>
            <span className="font-medium text-brand-500">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-orange-400"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Topic Form */}
      {!jobId && (
        <form onSubmit={handleGenerate} className="card mb-6">
          {insufficientCredits && (
            <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Not enough credits ({CREDITS_PER_VIDEO} required per video).
            </p>
          )}
          <label className="mb-2 block text-sm text-white/70">What&apos;s your viral topic?</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Why Japan's population is shrinking fast"
            required
            minLength={3}
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-brand-500 focus:outline-none"
          />

          <label className="mb-2 block text-sm text-white/70">Duration (seconds)</label>
          <input
            type="range"
            min={15}
            max={90}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mb-2 w-full accent-brand-500"
          />
          <p className="mb-6 text-sm text-white/40">{duration}s vertical short</p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || insufficientCredits} className="btn-primary w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting pipeline...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Viral Short
              </>
            )}
          </button>
        </form>
      )}

      {/* Animated Progress Logs */}
      <AnimatePresence>
        {logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              {isRunning && <Loader2 className="h-5 w-5 animate-spin text-brand-500" />}
              Pipeline Logs
            </h3>

            <div className="max-h-80 space-y-2 overflow-y-auto font-mono text-sm">
              {logs.map((log, i) => (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex gap-3 rounded-lg px-3 py-2",
                    log.level === "error" && "bg-red-500/10 text-red-400",
                    log.level === "warn" && "bg-yellow-500/10 text-yellow-400",
                    log.level === "success" && "bg-green-500/10 text-green-400",
                    log.level === "info" && "bg-white/5 text-white/70"
                  )}
                >
                  <span className="shrink-0 text-white/30">
                    [{log.phase}]
                  </span>
                  <span>{log.message}</span>
                </motion.div>
              ))}
              <div ref={logEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(outputUrl || phase === "completed") && phase !== "failed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card mt-6 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="mb-2 text-xl font-bold">Your viral short is ready!</h3>
          <p className="mb-6 text-white/60">9:16 vertical MP4 with burned-in subtitles</p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary gap-2"
          >
            {downloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Download Video
          </button>
          <button onClick={resetWizard} className="btn-secondary mt-4 block w-full">
            Create Another
          </button>
        </motion.div>
      )}

      {(phase === "failed" || (error && jobId)) && (
        <div className="card mt-6 border-red-500/30 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-4 text-red-400">{error || "Generation failed"}</p>
          <button onClick={resetWizard} className="btn-secondary w-full">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
