"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, Play, Download, Clock, Layers,
  MapPin, Mic2, Film, AlertCircle, Loader2,
  CheckCircle2
} from "lucide-react";
import { getVideo, pollVideoStatus } from "@/lib/api";
import { cn, formatDuration, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import * as Progress from "@radix-ui/react-progress";
import Link from "next/link";

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", id],
    queryFn: () => getVideo(id),
    refetchInterval: (query) => {
      const v = query.state.data;
      if (!v) return 2000;
      return ["completed", "failed"].includes(v.status) ? false : 3000;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Video not found.{" "}
        <Link href="/dashboard" className="text-brand-400 ml-2">Back to dashboard</Link>
      </div>
    );
  }

  const isActive = !["completed", "failed"].includes(video.status);
  const isCompleted = video.status === "completed";
  const isFailed = video.status === "failed";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Video + status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video player / status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
            <div
              className="relative bg-black flex items-center justify-center"
              style={{ aspectRatio: "21/9" }}
            >
              {isCompleted && video.output_video_url ? (
                <video
                  src={video.output_video_url}
                  controls
                  className="w-full h-full"
                  poster={video.thumbnail_url || undefined}
                />
              ) : isFailed ? (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-red-400 font-medium">Generation Failed</p>
                  {video.error_message && (
                    <p className="text-gray-500 text-sm mt-2 max-w-md">{video.error_message}</p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-3" />
                  <p className="text-gray-300 font-medium">{STATUS_LABELS[video.status]}</p>
                  <p className="text-gray-500 text-sm mt-1">{video.progress_percent}% complete</p>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {isActive && (
              <Progress.Root className="h-1.5 bg-surface-border" value={video.progress_percent}>
                <Progress.Indicator
                  className="h-full bg-gradient-to-r from-brand-600 to-purple-500 transition-all duration-700"
                  style={{ width: `${video.progress_percent}%` }}
                />
              </Progress.Root>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display font-bold text-2xl mb-1">{video.title}</h1>
                  <p className="text-gray-400 text-sm">{video.topic}</p>
                </div>
                <span className={cn("badge shrink-0", STATUS_COLORS[video.status])}>
                  {STATUS_LABELS[video.status]}
                </span>
              </div>

              {isCompleted && video.output_video_url && (
                <div className="flex gap-3 mt-4">
                  <a
                    href={video.output_video_url}
                    download
                    className="btn-primary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download MP4
                  </a>
                </div>
              )}
            </div>
          </motion.div>

          {/* Scene list */}
          {video.scenes && video.scenes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="font-display font-semibold text-lg mb-5">
                Scenes ({video.total_scenes})
              </h2>
              <div className="space-y-4">
                {video.scenes.map((scene) => (
                  <div
                    key={scene.scene_number}
                    className="flex gap-4 p-4 rounded-xl bg-surface-card/60 border border-surface-border"
                  >
                    <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center shrink-0 font-mono text-sm text-brand-400 font-bold">
                      {String(scene.scene_number).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 leading-relaxed mb-2 line-clamp-3">
                        {scene.narration_text}
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {scene.is_abstract_scene && (
                          <span className="badge bg-purple-500/10 text-purple-400 text-xs">AI Art</span>
                        )}
                        {scene.is_historical_character && (
                          <span className="badge bg-amber-500/10 text-amber-400 text-xs">
                            {scene.character_name || "Historical Character"}
                          </span>
                        )}
                        {scene.location_coordinates && (
                          <span className="badge bg-blue-500/10 text-blue-400 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {scene.location_coordinates.label}
                          </span>
                        )}
                        {scene.media_fetched && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        )}
                        {scene.visual_keywords.slice(0, 3).map((kw) => (
                          <span key={kw} className="badge bg-surface border border-surface-border text-gray-500 text-xs">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Metadata */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold mb-5">Project Details</h3>
            <div className="space-y-4">
              {[
                { label: "Language", value: video.language.toUpperCase(), icon: Film },
                { label: "Style", value: video.style, icon: Film },
                { label: "Scenes", value: video.total_scenes.toString(), icon: Layers },
                { label: "Duration", value: video.duration_seconds ? formatDuration(video.duration_seconds) : "—", icon: Clock },
                { label: "Audio", value: video.audio_url ? "Generated" : "Pending", icon: Mic2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  <span className="text-sm font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pipeline status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold mb-5">Pipeline</h3>
            <div className="space-y-2.5">
              {[
                { stage: "scripting", label: "LLM Script" },
                { stage: "fetching_media", label: "Media Scraping" },
                { stage: "generating_audio", label: "ElevenLabs TTS" },
                { stage: "animating", label: "Wan2.1 Animation" },
                { stage: "assembling", label: "Remotion Assembly" },
                { stage: "rendering", label: "FFmpeg Render" },
                { stage: "completed", label: "Complete" },
              ].map(({ stage, label }) => {
                const stages = ["pending", "scripting", "fetching_media", "generating_audio", "animating", "assembling", "rendering", "completed", "failed"];
                const currentIdx = stages.indexOf(video.status);
                const stageIdx = stages.indexOf(stage);
                const isDone = currentIdx > stageIdx || (video.status === "completed");
                const isCurrent = video.status === stage;

                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                      isDone ? "bg-green-500" : isCurrent ? "bg-brand-500 animate-pulse" : "bg-surface-border"
                    )}>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      {isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className={cn(
                      "text-sm",
                      isDone ? "text-green-400" : isCurrent ? "text-white" : "text-gray-600"
                    )}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
