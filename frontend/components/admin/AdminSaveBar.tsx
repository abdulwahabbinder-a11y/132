"use client";

import { CheckCircle2, Loader2, RotateCcw, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSaveBarProps {
  draftCount: number;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function AdminSaveBar({
  draftCount,
  saving,
  saved,
  onSave,
  onDiscard,
}: AdminSaveBarProps) {
  if (draftCount === 0 && !saved) return null;

  return (
    <div className="sticky bottom-4 z-30 mt-6">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#121214]/95 px-5 py-3 shadow-2xl backdrop-blur-md">
        <div className="text-sm">
          {saved ? (
            <span className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Configuration saved
            </span>
          ) : (
            <span className="text-white/50">
              <strong className="text-white/80">{draftCount}</strong> unsaved{" "}
              {draftCount === 1 ? "change" : "changes"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {draftCount > 0 && (
            <button
              onClick={onDiscard}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/50 transition hover:bg-white/5 hover:text-white/80 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Discard
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving || draftCount === 0}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition",
              saved
                ? "bg-green-600 text-white"
                : "bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
