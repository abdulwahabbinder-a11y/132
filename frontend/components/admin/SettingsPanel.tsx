"use client";

import { useState } from "react";
import { Eye, EyeOff, Key, Search } from "lucide-react";
import type { SettingItem } from "@/lib/admin/types";

interface SettingsPanelProps {
  title: string;
  settings: SettingItem[];
  draft: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  hint?: React.ReactNode;
}

const SELECT_FIELDS: Record<string, { options: { value: string; label: string }[] }> = {
  research_llm: {
    options: [
      { value: "claude", label: "Claude AI (recommended)" },
      { value: "llama", label: "Llama 3.1" },
    ],
  },
  script_llm: {
    options: [
      { value: "claude_then_llama", label: "Claude → Llama (best quality)" },
      { value: "claude", label: "Claude only" },
      { value: "llama", label: "Llama 3.1 only" },
    ],
  },
};

function SecretInput({
  setting,
  value,
  onChange,
}: {
  setting: SettingItem;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const hasMasked = setting.is_secret && setting.value_masked && !value;

  return (
    <div>
      {hasMasked && (
        <p className="mb-1 font-mono text-[10px] text-white/25">
          Current: {setting.value_masked}
        </p>
      )}
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          placeholder={setting.is_secret ? "Paste API key..." : setting.value || ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-10 font-mono text-sm text-white placeholder:text-white/20 focus:border-violet-500 focus:outline-none"
        />
        {setting.is_secret && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/30 transition hover:text-white/70"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function SettingsPanel({
  title,
  settings,
  draft,
  onUpdate,
  search,
  onSearchChange,
  hint,
}: SettingsPanelProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      {hint && <div className="mb-5">{hint}</div>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Key className="h-4 w-4 text-violet-400" />
          {title}
        </h2>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            placeholder="Search settings..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-white/25 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        {settings.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/30">
            {search ? "No settings match your search." : "No settings in this category."}
          </p>
        ) : (
          settings.map((setting) => {
            const value = draft[setting.key] ?? (setting.is_secret ? "" : setting.value);
            const selectConfig = SELECT_FIELDS[setting.key];

            return (
              <div
                key={setting.key}
                className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
              >
                <label className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/70">
                    {setting.label || setting.key}
                  </span>
                  <code className="text-[10px] text-white/20">{setting.key}</code>
                </label>

                {selectConfig ? (
                  <select
                    value={draft[setting.key] ?? setting.value}
                    onChange={(e) => onUpdate(setting.key, e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                  >
                    {selectConfig.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : setting.is_secret ? (
                  <SecretInput
                    setting={setting}
                    value={value}
                    onChange={(v) => onUpdate(setting.key, v)}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={setting.value || ""}
                    value={draft[setting.key] ?? setting.value}
                    onChange={(e) => onUpdate(setting.key, e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder:text-white/20 focus:border-violet-500 focus:outline-none"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
