"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isDemoAdminSession } from "@/lib/demo-auth";
import { DEMO_ADMIN_SETTINGS, DEMO_SCRAPER_STATUS } from "@/lib/demo-data";
import { api } from "@/lib/api";
import { VidrushShell } from "@/components/vidrush/VidrushShell";
import {
  Key, Save, Shield, Loader2, CheckCircle2, Globe, Brain, Film, CreditCard,
  ToggleLeft, ToggleRight, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingItem {
  key: string;
  value: string;
  category: string;
  label: string | null;
  is_secret: boolean;
  value_masked: string | null;
}

interface ScraperStatus {
  id: string;
  label: string;
  enabled: boolean;
  configured: boolean;
  ready: boolean;
}

const TABS = [
  { id: "scraping", label: "Scraping Tools", icon: Globe },
  { id: "llm", label: "AI / LLM", icon: Brain },
  { id: "media", label: "Media & Voice", icon: Film },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const CATEGORY_MAP: Record<string, string> = {
  scraping: "scraping",
  llm: "llm",
  media: "media",
  billing: "billing",
  api_keys: "scraping",
};

export default function AdminPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [scrapers, setScrapers] = useState<ScraperStatus[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("scraping");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Demo/preview admin (no Supabase required)
      if (isDemoAdminSession()) {
        setSettings(DEMO_ADMIN_SETTINGS);
        setScrapers(DEMO_SCRAPER_STATUS);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/auth/login"; return; }
      api.setToken(session.access_token);
      try {
        const [data, scraperData] = await Promise.all([
          api.getAdminSettings(),
          api.getScraperStatus(),
        ]);
        setSettings(data);
        setScrapers(scraperData);
      } catch {
        setError("Admin access required. Run: UPDATE users SET is_admin = true WHERE email = 'you@example.com'");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    if (isDemoAdminSession()) {
      setSaved(true);
      setDraft({});
      setTimeout(() => setSaved(false), 3000);
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    api.setToken(session.access_token);
    try {
      const toUpdate: Record<string, string> = {};
      for (const [key, val] of Object.entries(draft)) {
        if (val !== undefined && val !== "") toUpdate[key] = val;
      }
      await api.updateAdminSettings(toUpdate);
      setSaved(true);
      setDraft({});
      const [data, scraperData] = await Promise.all([
        api.getAdminSettings(),
        api.getScraperStatus(),
      ]);
      setSettings(data);
      setScrapers(scraperData);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleScraper = (toggleKey: string, current: string) => {
    const newVal = current === "true" ? "false" : "true";
    setDraft((d) => ({ ...d, [toggleKey]: newVal }));
    setSettings((prev) =>
      prev.map((s) => s.key === toggleKey ? { ...s, value: newVal } : s)
    );
  };

  const getVal = (key: string) => draft[key] ?? settings.find((s) => s.key === key)?.value ?? "";

  const apiKeySettings = settings.filter((s) => {
    const cat = CATEGORY_MAP[s.category] || s.category;
    return cat === activeTab && !s.key.endsWith("_enabled");
  });

  const readyCount = scrapers.filter((s) => s.ready).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error && settings.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-6">
        <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold">Admin Access Required</h1>
          <p className="text-sm text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <VidrushShell>
      <div className="mx-auto max-w-4xl px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Control Panel</h1>
          <p className="text-sm text-white/40">
            Configure all scraping tools, Claude AI, and media APIs — changes apply within 60 seconds
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition",
                activeTab === id
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Scraping tab — status grid */}
        {activeTab === "scraping" && (
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/70">
                Scraper Status — {readyCount}/{scrapers.length} ready
              </h2>
              <span className="text-xs text-white/30">More sources = richer videos</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {scrapers.map((s) => {
                const toggleKey = `scraper_${s.id}_enabled`;
                const enabled = getVal(toggleKey) !== "false";
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-xl border p-3 transition",
                      s.ready ? "border-green-500/30 bg-green-500/5" : "border-white/[0.06] bg-white/[0.02]"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold">{s.label}</span>
                      <button onClick={() => toggleScraper(toggleKey, getVal(toggleKey) || "true")}>
                        {enabled
                          ? <ToggleRight className="h-5 w-5 text-violet-400" />
                          : <ToggleLeft className="h-5 w-5 text-white/20" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {s.ready ? (
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                      ) : s.configured ? (
                        <AlertCircle className="h-3 w-3 text-yellow-400" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-white/20" />
                      )}
                      <span className="text-[10px] text-white/40">
                        {s.ready ? "Ready" : s.configured ? "No key" : "Not configured"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LLM tab — highlight Claude */}
        {activeTab === "llm" && (
          <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <h3 className="mb-1 text-sm font-semibold text-violet-300">Research Pipeline</h3>
            <p className="text-xs text-white/50">
              <strong className="text-white/70">Claude AI</strong> synthesizes all scraped data into a research brief.
              <strong className="text-white/70"> Llama 3.1</strong> or Claude then writes the viral script.
              Set <code className="text-violet-300">research_llm</code> and <code className="text-violet-300">script_llm</code> below.
            </p>
          </div>
        )}

        {/* API key fields */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Key className="h-4 w-4 text-violet-400" />
            {TABS.find((t) => t.id === activeTab)?.label} — API Keys
          </h2>
          <div className="space-y-4">
            {apiKeySettings.length === 0 ? (
              <p className="text-sm text-white/30">No settings in this category yet. Run migration 003.</p>
            ) : (
              apiKeySettings.map((setting) => (
                <div key={setting.key}>
                  <label className="mb-1 block text-xs font-medium text-white/70">
                    {setting.label || setting.key}
                  </label>
                  {setting.is_secret && setting.value_masked && !draft[setting.key] && (
                    <p className="mb-1 font-mono text-[10px] text-white/25">
                      Current: {setting.value_masked}
                    </p>
                  )}
                  {setting.key === "research_llm" || setting.key === "script_llm" ? (
                    <select
                      value={draft[setting.key] ?? setting.value}
                      onChange={(e) => setDraft((d) => ({ ...d, [setting.key]: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                    >
                      {setting.key === "research_llm" ? (
                        <>
                          <option value="claude">Claude AI (recommended)</option>
                          <option value="llama">Llama 3.1</option>
                        </>
                      ) : (
                        <>
                          <option value="claude_then_llama">Claude → Llama (best)</option>
                          <option value="claude">Claude only</option>
                          <option value="llama">Llama 3.1 only</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <input
                      type={setting.is_secret ? "password" : "text"}
                      placeholder={setting.is_secret ? "Paste API key..." : setting.value || ""}
                      value={draft[setting.key] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [setting.key]: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder:text-white/20 focus:border-violet-500 focus:outline-none"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || Object.keys(draft).length === 0}
          className={cn(
            "mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition",
            saved ? "bg-green-600 text-white" : "bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
          )}
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> :
           saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> :
           <><Save className="h-4 w-4" /> Save Configuration</>}
        </button>
      </div>
    </VidrushShell>
  );
}
