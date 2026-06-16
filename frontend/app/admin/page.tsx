"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { Key, Save, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingItem {
  key: string;
  value: string;
  category: string;
  label: string | null;
  is_secret: boolean;
  value_masked: string | null;
}

export default function AdminPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/auth/login";
        return;
      }

      api.setToken(session.access_token);
      try {
        const data = await api.getAdminSettings();
        setSettings(data);
      } catch {
        setError("Admin access required. Set is_admin=true on your user in Supabase.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    api.setToken(session.access_token);
    try {
      const toUpdate: Record<string, string> = {};
      for (const [key, val] of Object.entries(draft)) {
        if (val.trim()) toUpdate[key] = val.trim();
      }
      await api.updateAdminSettings(toUpdate);
      setSaved(true);
      setDraft({});
      const data = await api.getAdminSettings();
      setSettings(data);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const grouped = settings.reduce<Record<string, SettingItem[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error && settings.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="card max-w-md text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h1 className="mb-2 text-xl font-bold">Access Denied</h1>
          <p className="text-white/60">{error}</p>
          <Link href="/dashboard" className="btn-secondary mt-6 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-500" />
            <span className="font-bold">Admin Control Panel</span>
          </div>
          <Link href="/dashboard" className="text-sm text-white/60 hover:text-white">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">API Key Configuration</h1>
          <p className="mt-1 text-white/60">
            All pipeline API keys are loaded dynamically from Supabase. Changes take effect within 60 seconds.
          </p>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="card mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold capitalize">
              <Key className="h-5 w-5 text-brand-500" />
              {category.replace("_", " ")}
            </h2>

            <div className="space-y-4">
              {items.map((setting) => (
                <div key={setting.key}>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">
                    {setting.label || setting.key}
                  </label>
                  {setting.is_secret && setting.value_masked && (
                    <p className="mb-1 font-mono text-xs text-white/30">
                      Current: {setting.value_masked}
                    </p>
                  )}
                  <input
                    type={setting.is_secret ? "password" : "text"}
                    placeholder={setting.is_secret ? "Enter new key to update..." : setting.value || ""}
                    value={draft[setting.key] ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [setting.key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/30 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving || Object.keys(draft).length === 0}
          className={cn("btn-primary w-full gap-2", saved && "bg-green-600")}
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save API Keys
            </>
          )}
        </button>
      </main>
    </div>
  );
}
