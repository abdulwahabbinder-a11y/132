import { appConfig } from "@/lib/config";
import type {
  JobResponse,
  StoryGenerationRequest,
  StoryGenerationResponse,
  SubscriptionSummary,
} from "@/lib/types";

async function apiFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchSubscription(accessToken: string): Promise<SubscriptionSummary> {
  return apiFetch<SubscriptionSummary>("/me/subscription", accessToken, { method: "GET" });
}

export async function fetchJobs(accessToken: string): Promise<JobResponse[]> {
  return apiFetch<JobResponse[]>("/jobs", accessToken, { method: "GET" });
}

export async function generateStory(
  accessToken: string,
  payload: StoryGenerationRequest,
): Promise<StoryGenerationResponse> {
  return apiFetch<StoryGenerationResponse>("/generate-story", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestMagicLink(email: string) {
  const response = await fetch("/api/auth/magic-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to send login link.");
  }
}
