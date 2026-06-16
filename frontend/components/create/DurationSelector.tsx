"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOCUMENTARY_DURATION_MINUTES,
  LISTICLE_DURATION_MINUTES,
  VIRAL_DURATION_SECONDS,
  type VideoFormat,
  formatDurationLabel,
} from "@/lib/video-duration";

interface DurationSelectorProps {
  format: VideoFormat;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  variant?: "compact" | "card";
}

export function DurationSelector({
  format,
  value,
  onChange,
  className,
  variant = "card",
}: DurationSelectorProps) {
  const options =
    format === "viral"
      ? VIRAL_DURATION_SECONDS
      : format === "documentary"
        ? DOCUMENTARY_DURATION_MINUTES
        : LISTICLE_DURATION_MINUTES;

  const isViral = format === "viral";

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center gap-1", className)}>
        <Clock className="h-3 w-3 shrink-0 text-white/30" />
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded px-2 py-0.5 text-[11px] font-medium transition",
              value === opt.value
                ? "bg-violet-600/30 text-violet-200"
                : "text-white/35 hover:bg-white/10 hover:text-white/70"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-white/[0.02] p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-white/80">Video length</span>
        </div>
        <span className="text-xs font-semibold text-violet-300">
          {formatDurationLabel(format, value)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition",
              value === opt.value
                ? "border-violet-500/50 bg-violet-600/20 text-violet-200"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isViral && (
        <div className="mt-4">
          <label className="mb-2 flex justify-between text-xs text-white/45">
            <span>Custom length</span>
            <span className="font-medium text-white/70">{value}s</span>
          </label>
          <input
            type="range"
            min={15}
            max={90}
            step={5}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-white/25">
            <span>15 sec</span>
            <span>90 sec</span>
          </div>
        </div>
      )}

      {!isViral && (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs text-white/45">
            Or enter custom minutes (1–30)
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={value}
            onChange={(e) => {
              const n = Math.min(30, Math.max(1, Number(e.target.value) || 1));
              onChange(n);
            }}
            className="w-full max-w-[120px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          />
        </div>
      )}

      <p className="mt-3 text-[11px] text-white/30">
        {isViral
          ? "Shorter = faster render. 60 sec is ideal for TikTok & Reels."
          : "Longer videos include more scenes and deeper research."}
      </p>
    </div>
  );
}
