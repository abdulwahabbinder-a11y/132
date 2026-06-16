import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const STATUS_LABELS: Record<string, string> = {
  pending:           "Queued",
  scripting:         "Writing Script",
  fetching_media:    "Fetching Media",
  generating_audio:  "Generating Voice",
  animating:         "Animating Scenes",
  assembling:        "Assembling Video",
  rendering:         "Rendering",
  completed:         "Completed",
  failed:            "Failed",
};

export const STATUS_COLORS: Record<string, string> = {
  pending:           "text-yellow-400 bg-yellow-400/10",
  scripting:         "text-blue-400 bg-blue-400/10",
  fetching_media:    "text-purple-400 bg-purple-400/10",
  generating_audio:  "text-cyan-400 bg-cyan-400/10",
  animating:         "text-indigo-400 bg-indigo-400/10",
  assembling:        "text-orange-400 bg-orange-400/10",
  rendering:         "text-pink-400 bg-pink-400/10",
  completed:         "text-green-400 bg-green-400/10",
  failed:            "text-red-400 bg-red-400/10",
};
