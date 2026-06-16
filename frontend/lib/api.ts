import { supabaseBrowser } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function authHeaders(): Promise<Record<string, string>> {
  const sb = supabaseBrowser();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(init.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ----- Typed helpers ---------------------------------------------------------

export type Subscription = {
  plan_type: "free" | "pro";
  status: string;
  video_credits_left: number;
  billing_cycle_end?: string | null;
  stripe_customer_id?: string | null;
};

export type Video = {
  id: string;
  topic: string;
  language: string;
  status:
    | "queued"
    | "scripting"
    | "scraping"
    | "rendering"
    | "composing"
    | "completed"
    | "failed";
  progress_pct: number;
  output_url?: string | null;
  duration_seconds?: number | null;
  error_message?: string | null;
  created_at: string;
};

export const api = {
  getSubscription: () => apiFetch<Subscription>("/api/subscription"),
  listVideos: () => apiFetch<Video[]>("/api/videos"),
  getVideo: (id: string) => apiFetch<Video>(`/api/videos/${id}`),
  generateStory: (body: {
    topic: string;
    language: string;
    tone: string;
    target_duration_seconds: number;
  }) =>
    apiFetch<{ video_id: string; script: unknown; credits_left: number }>(
      "/api/generate-story",
      { method: "POST", body: JSON.stringify(body) }
    ),
  startCheckout: () =>
    apiFetch<{ checkout_url: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({
        success_url: `${window.location.origin}/dashboard?upgraded=1`,
        cancel_url: `${window.location.origin}/pricing`,
      }),
    }),
  openPortal: () =>
    apiFetch<{ portal_url: string }>("/api/billing/portal", { method: "POST" }),
};
