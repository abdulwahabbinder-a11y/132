"use client";

import { getAccessToken } from "./supabaseClient";
import type {
  GenerateStoryResponse,
  Language,
  Plan,
  Subscription,
  VideoJob,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = await getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(detail, res.status);
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const api = {
  getPlans: () => request<{ plans: Plan[] }>("/api/billing/plans", {}, false),

  getSubscription: () => request<Subscription>("/api/me/subscription"),

  listVideos: () => request<VideoJob[]>("/api/videos"),

  getVideo: (id: string) => request<VideoJob>(`/api/videos/${id}`),

  generateStory: (topic: string, language: Language, targetSceneCount = 12) =>
    request<GenerateStoryResponse>("/api/generate-story", {
      method: "POST",
      body: JSON.stringify({
        topic,
        language,
        target_scene_count: targetSceneCount,
      }),
    }),

  createCheckout: (successUrl: string, cancelUrl: string) =>
    request<{ checkout_url: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ success_url: successUrl, cancel_url: cancelUrl }),
    }),
};
