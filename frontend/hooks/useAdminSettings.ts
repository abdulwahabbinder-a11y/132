"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import {
  clearDemoSession,
  getDemoSession,
  isDemoAdminSession,
} from "@/lib/demo-auth";
import { DEMO_ADMIN_SETTINGS, DEMO_SCRAPER_STATUS } from "@/lib/demo-data";
import type { ScraperStatus, SettingItem } from "@/lib/admin/types";
import {
  DEMO_STORAGE_KEY,
  getSettingValue,
  scraperToggleKey,
  syncScraperList,
} from "@/lib/admin/utils";

interface DemoStoredData {
  settings: SettingItem[];
  scrapers: ScraperStatus[];
}

function loadDemoStorage(): DemoStoredData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoStoredData;
  } catch {
    return null;
  }
}

function saveDemoStorage(settings: SettingItem[], scrapers: ScraperStatus[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({ settings, scrapers })
  );
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [scrapers, setScrapers] = useState<ScraperStatus[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemoAdminSession()) {
      const stored = loadDemoStorage();
      setSettings(stored?.settings ?? DEMO_ADMIN_SETTINGS);
      setScrapers(stored?.scrapers ?? DEMO_SCRAPER_STATUS);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    if (getDemoSession()?.role === "user") {
      window.location.href = "/dashboard";
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      window.location.href = "/auth/login";
      return;
    }

    api.setToken(session.access_token);
    try {
      const [data, scraperData] = await Promise.all([
        api.getAdminSettings(),
        api.getScraperStatus(),
      ]);
      setSettings(data);
      setScrapers(scraperData);
      setIsDemo(false);
    } catch {
      setError(
        "Admin access required. Run: UPDATE users SET is_admin = true WHERE email = 'your@email.com'"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateDraft = useCallback((key: string, value: string) => {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      setScrapers((prev) => syncScraperList(prev, settings, next));
      return next;
    });
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  }, [settings]);

  const toggleScraper = useCallback(
    (scraperId: string) => {
      const toggleKey = scraperToggleKey(scraperId);
      const current = getSettingValue(toggleKey, settings, draft) || "true";
      const newVal = current === "true" ? "false" : "true";
      updateDraft(toggleKey, newVal);
    },
    [settings, draft, updateDraft]
  );

  const bulkToggleScrapers = useCallback(
    (enable: boolean) => {
      const val = enable ? "true" : "false";
      const updates: Record<string, string> = {};
      for (const s of scrapers) {
        updates[scraperToggleKey(s.id)] = val;
      }
      setSettings((prev) =>
        prev.map((s) =>
          s.key.endsWith("_enabled") && updates[s.key] !== undefined
            ? { ...s, value: updates[s.key] }
            : s
        )
      );
      setDraft((d) => {
        const next = { ...d, ...updates };
        setScrapers((prev) => syncScraperList(prev, settings, next));
        return next;
      });
    },
    [scrapers, settings]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);

    if (isDemo) {
      saveDemoStorage(settings, scrapers);
      setSaved(true);
      setDraft({});
      setTimeout(() => setSaved(false), 3000);
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSaving(false);
      return;
    }
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
  }, [isDemo, settings, scrapers, draft]);

  const handleLogout = useCallback(async () => {
    if (isDemo) {
      clearDemoSession();
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    window.location.href = "/auth/login";
  }, [isDemo]);

  const discardDraft = useCallback(() => {
    setDraft({});
    load();
  }, [load]);

  const draftCount = Object.keys(draft).length;

  return {
    settings,
    scrapers,
    draft,
    loading,
    saving,
    saved,
    error,
    isDemo,
    draftCount,
    updateDraft,
    toggleScraper,
    bulkToggleScrapers,
    handleSave,
    handleLogout,
    discardDraft,
    getVal: (key: string) => getSettingValue(key, settings, draft),
  };
}
