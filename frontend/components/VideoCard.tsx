"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play, Trash2, ExternalLink, Clock, Layers,
  AlertCircle, Loader2
} from "lucide-react";
import { VideoProject } from "@/lib/api";
import { cn, formatDuration, formatRelativeTime, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import * as Progress from "@radix-ui/react-progress";

interface Props {
  video: VideoProject;
  onDelete: () => void;
}

const ACTIVE_STATUSES = ["pending", "scripting", "fetching_media", "generating_audio", "animating", "assembling", "rendering"];

export function VideoCard({ video, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isActive = ACTIVE_STATUSES.includes(video.status);
  const isCompleted = video.status === "completed";
  const isFailed = video.status === "failed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card overflow-hidden group hover:border-brand-700 transition-all duration-300"
    >
      {/* Thumbnail / Status area */}
      <div className="relative bg-surface" style={{ aspectRatio: "21/9" }}>
        {video.thumbnail_url && isCompleted ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface via-surface-card to-surface-border">
            {isActive ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">{STATUS_LABELS[video.status]}</p>
              </div>
            ) : isFailed ? (
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-red-400">Generation failed</p>
              </div>
            ) : (
              <Play className="w-8 h-8 text-gray-600" />
            )}
          </div>
        )}

        {/* Overlay on hover for completed */}
        {isCompleted && video.output_video_url && (
          <a
            href={video.output_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <div className="w-14 h-14 bg-brand-600/80 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </div>
          </a>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={cn("badge text-xs font-medium", STATUS_COLORS[video.status])}>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1" />}
            {STATUS_LABELS[video.status]}
          </span>
        </div>

        {/* Duration */}
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2">
            <span className="badge bg-black/60 text-white text-xs">
              {formatDuration(video.duration_seconds)}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar for active */}
      {isActive && (
        <Progress.Root className="h-1 bg-surface-border" value={video.progress_percent}>
          <Progress.Indicator
            className="h-full bg-gradient-to-r from-brand-600 to-purple-500 transition-all duration-500"
            style={{ width: `${video.progress_percent}%` }}
          />
        </Progress.Root>
      )}

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-sm leading-snug mb-2 line-clamp-2">
          {video.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" /> {video.total_scenes} scenes
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatRelativeTime(video.created_at)}
          </span>
          <span className="capitalize">{video.style}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/video/${video.id}`}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 flex-1 justify-center border border-surface-border rounded-lg"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Details
          </Link>

          {confirmDelete ? (
            <div className="flex gap-1.5">
              <button
                onClick={onDelete}
                className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-3 py-1.5 bg-surface-border rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn-ghost p-1.5 text-gray-500 hover:text-red-400 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
