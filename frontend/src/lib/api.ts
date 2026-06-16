import { getAccessToken } from "@/lib/supabaseClient";
import type {
  Account,
  GenerateStoryRequest,
  GenerateStoryResponse,
  VideoDetail,
  VideoSummary,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore non-JSON errors */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export const api = {
  getAccount: () => request<Account>("/me"),

  generateStory: (payload: GenerateStoryRequest) =>
    request<GenerateStoryResponse>("/generate-story", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listVideos: () =>
    request<{ videos: VideoSummary[] }>("/videos").then((r) => r.videos),

  getVideo: (id: string) => request<VideoDetail>(`/videos/${id}`),

  createCheckout: () =>
    request<{ checkout_url: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan: "pro" }),
    }),

  openBillingPortal: () =>
    request<{ portal_url: string }>("/billing/portal", { method: "POST" }),
};

export { ApiError };
