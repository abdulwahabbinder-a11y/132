import {
  CREDITS_PER_VIDEO,
  FREE_PLAN_CREDITS,
  FREE_PLAN_VIDEOS,
  PRO_PLAN_CREDITS,
  PRO_PLAN_PRICE,
  PRO_PLAN_VIDEOS,
} from "@/lib/credits";
import type { AdminStats, AdminTabId, ScraperStatus, SettingItem } from "./types";

export const ADMIN_TABS: { id: AdminTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "scraping", label: "Scraping" },
  { id: "llm", label: "AI / LLM" },
  { id: "media", label: "Media" },
  { id: "billing", label: "Billing" },
];

export const CATEGORY_MAP: Record<string, AdminTabId> = {
  scraping: "scraping",
  llm: "llm",
  media: "media",
  billing: "billing",
  api_keys: "scraping",
};

const SECRET_KEY_SUFFIXES = ["_api_key", "_secret", "_token", "_client_secret"];

export function isSecretKey(key: string): boolean {
  return SECRET_KEY_SUFFIXES.some((s) => key.endsWith(s));
}

export function getSettingValue(
  key: string,
  settings: SettingItem[],
  draft: Record<string, string>
): string {
  return draft[key] ?? settings.find((s) => s.key === key)?.value ?? "";
}

export function scraperToggleKey(id: string): string {
  return `scraper_${id}_enabled`;
}

const SCRAPER_API_KEYS: Record<string, string | null> = {
  tavily: "tavily_api_key",
  jina: "jina_api_key",
  serper: "serper_api_key",
  firecrawl: "firecrawl_api_key",
  exa: "exa_api_key",
  brave: "brave_search_api_key",
  newsapi: "newsapi_key",
  google_cse: "google_cse_api_key",
  wikipedia: null,
  internet_archive: null,
};

export function isScraperReady(
  scraper: ScraperStatus,
  settings: SettingItem[],
  draft: Record<string, string>
): boolean {
  const enabled =
    getSettingValue(scraperToggleKey(scraper.id), settings, draft) !== "false";
  if (!enabled) return false;

  const apiKey = SCRAPER_API_KEYS[scraper.id];
  if (!apiKey) return true;

  const val = getSettingValue(apiKey, settings, draft);
  const masked = settings.find((s) => s.key === apiKey)?.value_masked;
  return Boolean(val || masked);
}

export function syncScraperList(
  scrapers: ScraperStatus[],
  settings: SettingItem[],
  draft: Record<string, string>
): ScraperStatus[] {
  return scrapers.map((s) => {
    const enabled =
      getSettingValue(scraperToggleKey(s.id), settings, draft) !== "false";
    const apiKey = SCRAPER_API_KEYS[s.id];
    const configured = apiKey
      ? Boolean(
          getSettingValue(apiKey, settings, draft) ||
            settings.find((st) => st.key === apiKey)?.value_masked
        )
      : true;
    return {
      ...s,
      enabled,
      configured,
      ready: isScraperReady(s, settings, draft),
    };
  });
}

export function settingsForTab(
  settings: SettingItem[],
  tab: AdminTabId,
  search: string
): SettingItem[] {
  if (tab === "overview") return [];

  const q = search.trim().toLowerCase();
  return settings.filter((s) => {
    const cat = CATEGORY_MAP[s.category] || s.category;
    if (cat !== tab) return false;
    if (s.key.endsWith("_enabled")) return false;
    if (!q) return true;
    const label = (s.label || s.key).toLowerCase();
    return label.includes(q) || s.key.toLowerCase().includes(q);
  });
}

export function computeAdminStats(
  settings: SettingItem[],
  scrapers: ScraperStatus[],
  draft: Record<string, string>
): AdminStats {
  const secretKeys = settings.filter(
    (s) => s.is_secret && !s.key.endsWith("_enabled")
  );
  const keysConfigured = secretKeys.filter((s) => {
    const val = getSettingValue(s.key, settings, draft);
    return Boolean(val || s.value_masked);
  }).length;

  const scrapersReady = scrapers.filter((s) =>
    isScraperReady(s, settings, draft)
  ).length;

  const llmReady = Boolean(
    getSettingValue("claude_api_key", settings, draft) ||
      settings.find((s) => s.key === "claude_api_key")?.value_masked
  );

  const mediaKeys = ["elevenlabs_api_key", "pexels_api_key", "nvidia_nim_api_key"];
  const mediaReady = mediaKeys.some((k) => {
    const val = getSettingValue(k, settings, draft);
    const masked = settings.find((s) => s.key === k)?.value_masked;
    return Boolean(val || masked);
  });

  const billingReady = Boolean(
    getSettingValue("stripe_secret_key", settings, draft) ||
      settings.find((s) => s.key === "stripe_secret_key")?.value_masked
  );

  const healthParts = [
    scrapersReady / Math.max(scrapers.length, 1),
    keysConfigured / Math.max(secretKeys.length, 1),
    llmReady ? 1 : 0,
    mediaReady ? 1 : 0,
    billingReady ? 1 : 0,
  ];
  const healthScore = Math.round(
    (healthParts.reduce((a, b) => a + b, 0) / healthParts.length) * 100
  );

  return {
    scrapersReady,
    scrapersTotal: scrapers.length,
    keysConfigured,
    keysTotal: secretKeys.length,
    healthScore,
    llmReady,
    mediaReady,
    billingReady,
  };
}

export const CREDITS_CONFIG = {
  creditsPerVideo: CREDITS_PER_VIDEO,
  freePlanCredits: FREE_PLAN_CREDITS,
  freePlanVideos: FREE_PLAN_VIDEOS,
  proPlanCredits: PRO_PLAN_CREDITS,
  proPlanVideos: PRO_PLAN_VIDEOS,
  proPlanPrice: PRO_PLAN_PRICE,
};

export const DEMO_STORAGE_KEY = "docuforge_demo_admin_data";
