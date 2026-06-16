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

export type AdminTabId = "overview" | "users" | "scraping" | "llm" | "media" | "billing";

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

export interface AdminUsersSummary {
  total_users: number;
  pro_users: number;
  free_users: number;
  total_videos_completed: number;
  credits_per_video: number;
}

export interface AdminUserRow {
  user_id: string;
  email: string;
  full_name: string;
  plan_type: string;
  is_admin: boolean;
  signed_up_at: string | null;
  credits_remaining: number;
  credits_used_estimate: number;
  plan_credits_allocation: number;
  documentary_jobs: number;
  documentary_completed: number;
  short_jobs: number;
  shorts_completed: number;
  videos_completed: number;
  jobs_failed: number;
  jobs_in_progress: number;
  last_active_at: string | null;
  stripe_customer_id?: string | null;
  billing_cycle_end?: string | null;
}

export interface AdminUsersData {
  summary: AdminUsersSummary;
  users: AdminUserRow[];
}
