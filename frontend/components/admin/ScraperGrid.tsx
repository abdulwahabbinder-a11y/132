"use client";

import {
  AlertCircle,
  CheckCircle2,
  Power,
  PowerOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScraperStatus, SettingItem } from "@/lib/admin/types";
import {
  isScraperReady,
  scraperToggleKey,
} from "@/lib/admin/utils";

interface ScraperGridProps {
  scrapers: ScraperStatus[];
  settings: SettingItem[];
  draft: Record<string, string>;
  getVal: (key: string) => string;
  onToggle: (id: string) => void;
  onBulkEnable: (enable: boolean) => void;
}

export function ScraperGrid({
  scrapers,
  settings,
  draft,
  getVal,
  onToggle,
  onBulkEnable,
}: ScraperGridProps) {
  const readyCount = scrapers.filter((s) =>
    isScraperReady(s, settings, draft)
  ).length;

  return (
    <div className="mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white/70">
            Scraper Status — {readyCount}/{scrapers.length} ready
          </h2>
          <p className="text-xs text-white/30">
            More active sources = richer, fact-based videos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onBulkEnable(true)}
            className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-500/20"
          >
            <Power className="h-3.5 w-3.5" />
            Enable All
          </button>
          <button
            onClick={() => onBulkEnable(false)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition hover:bg-white/10"
          >
            <PowerOff className="h-3.5 w-3.5" />
            Disable All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {scrapers.map((s) => {
          const toggleKey = scraperToggleKey(s.id);
          const enabled = getVal(toggleKey) !== "false";
          const isReady = isScraperReady(s, settings, draft);

          return (
            <div
              key={s.id}
              className={cn(
                "group rounded-xl border p-3 transition hover:border-white/15",
                isReady
                  ? "border-green-500/30 bg-green-500/5"
                  : enabled
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-white/[0.06] bg-white/[0.02] opacity-70"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-1">
                <span className="truncate text-xs font-semibold">{s.label}</span>
                <button
                  onClick={() => onToggle(s.id)}
                  className="shrink-0 transition hover:scale-110"
                  title={enabled ? "Disable" : "Enable"}
                >
                  {enabled ? (
                    <ToggleRight className="h-5 w-5 text-violet-400" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-white/20" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                {isReady ? (
                  <CheckCircle2 className="h-3 w-3 text-green-400" />
                ) : s.configured ? (
                  <AlertCircle className="h-3 w-3 text-amber-400" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-white/20" />
                )}
                <span className="text-[10px] text-white/40">
                  {!enabled
                    ? "Disabled"
                    : isReady
                      ? "Ready"
                      : s.configured
                        ? "Key missing"
                        : "Not configured"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
