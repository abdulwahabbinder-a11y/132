import { getAccessToken } from "./supabase";

export type SupportedLanguage = "english" | "hindi" | "urdu" | "roman";

export type StoryScene = {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: {
    latitude: number;
    longitude: number;
    label?: string | null;
  } | null;
};

export type GenerateStoryResponse = {
  job_id: string;
  status: string;
  credits_left: number;
  scenes: StoryScene[];
};

export type JobStatusResponse = {
  id: string;
  status: string;
  topic: string;
  language: string;
  story_json: StoryScene[];
  asset_manifest: Record<string, unknown>;
  render_payload: Record<string, unknown>;
  final_video_url?: string | null;
  error_message?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function generateStory(input: {
  topic: string;
  language: SupportedLanguage;
  target_duration_minutes: number;
  tone: string;
  fallbackToken?: string;
}): Promise<GenerateStoryResponse> {
  const token = (await getAccessToken()) ?? input.fallbackToken;
  const response = await fetch(`${API_BASE_URL}/api/generate-story`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      topic: input.topic,
      language: input.language,
      target_duration_minutes: input.target_duration_minutes,
      tone: input.tone
    })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "Story generation failed");
  }
  return response.json();
}

export async function getJobStatus(
  jobId: string,
  fallbackToken?: string
): Promise<JobStatusResponse> {
  const token = (await getAccessToken()) ?? fallbackToken;
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "Unable to load job status");
  }
  return response.json();
}
