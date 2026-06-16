import { getAccessToken } from "./supabase";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, body, body?.detail ?? res.statusText);
  }
  return body as T;
}

export interface SubscriptionPublic {
  plan_type: "free" | "pro";
  video_credits_left: number;
  billing_cycle_end: string | null;
  stripe_customer_id: string | null;
}

export interface Scene {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
}

export interface StoryScript {
  topic: string;
  language: string;
  model: string;
  summary: string | null;
  scenes: Scene[];
}

export interface GenerateStoryResponse {
  job_id: string;
  credits_left: number;
  script: StoryScript;
}

export interface VideoJob {
  id: string;
  topic: string;
  language: string;
  status: string;
  output_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export const api = {
  mySubscription: () => request<SubscriptionPublic>("/api/subscriptions/me"),
  startCheckout: () =>
    request<{ url: string }>("/api/subscriptions/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: "pro" }),
    }),
  generateStory: (payload: {
    topic: string;
    language: "en" | "hi" | "ur" | "roman";
    target_duration_seconds?: number;
    style?: string;
  }) =>
    request<GenerateStoryResponse>("/api/generate-story", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listJobs: () => request<VideoJob[]>("/api/videos"),
  getJob: (id: string) => request<VideoJob>(`/api/videos/${id}`),
};
