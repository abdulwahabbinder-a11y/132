import { clientEnv } from "@/lib/env";

export type LanguageOption = "english" | "hindi" | "urdu" | "roman";

export interface StoryScene {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface DashboardPayload {
  user: {
    id: string;
    email: string;
    plan_type: string;
    video_credits_left: number;
    billing_cycle_end: string | null;
  };
  recent_projects: {
    id: string;
    topic: string;
    language: string;
    status: string;
    render_output_url: string | null;
    created_at: string;
  }[];
}

async function apiRequest<T>(
  path: string,
  init?: RequestInit & { accessToken?: string },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.accessToken) {
    headers.set("Authorization", `Bearer ${init.accessToken}`);
  }

  const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getDashboard(accessToken: string) {
  return apiRequest<DashboardPayload>("/api/dashboard", { method: "GET", accessToken });
}

export function generateStory(
  accessToken: string,
  payload: {
    topic: string;
    language: LanguageOption;
    target_duration_seconds: number;
    tone: string;
  },
) {
  return apiRequest<{
    project_id: string;
    status: string;
    source_model: string;
    credits_left: number;
    scenes: StoryScene[];
  }>("/api/generate-story", {
    method: "POST",
    accessToken,
    body: JSON.stringify(payload),
  });
}
