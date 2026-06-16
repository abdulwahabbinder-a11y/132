export interface SettingItem {
  key: string;
  value: string;
  category: string;
  label: string | null;
  is_secret: boolean;
  value_masked: string | null;
}

export interface ScraperStatus {
  id: string;
  label: string;
  enabled: boolean;
  configured: boolean;
  ready: boolean;
}

export type AdminTabId = "overview" | "scraping" | "llm" | "media" | "billing";

export interface AdminStats {
  scrapersReady: number;
  scrapersTotal: number;
  keysConfigured: number;
  keysTotal: number;
  healthScore: number;
  llmReady: boolean;
  mediaReady: boolean;
  billingReady: boolean;
}
