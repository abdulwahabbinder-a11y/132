import axios from "axios";
import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach Supabase JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Types
export interface StoryRequest {
  topic: string;
  language: "en" | "hi" | "ur" | "ro";
  style: "documentary" | "explainer" | "vox";
  aspect_ratio: "21:9" | "16:9" | "9:16";
  num_scenes: number;
}

export interface Scene {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: { lat: number; lng: number; zoom: number; label: string } | null;
}

export interface VideoProject {
  id: string;
  title: string;
  topic: string;
  language: string;
  style: string;
  status: string;
  progress_percent: number;
  thumbnail_url: string | null;
  output_video_url: string | null;
  duration_seconds: number | null;
  total_scenes: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  word_timestamps: Record<string, unknown> | null;
  scenes?: Scene[];
}

export interface StoryResponse {
  project_id: string;
  title: string;
  status: string;
  total_scenes: number;
  scenes: Scene[];
  credits_remaining: number;
}

// ── API functions ──────────────────────────────────────────────────────────────

export async function generateStory(payload: StoryRequest): Promise<StoryResponse> {
  const { data } = await apiClient.post<StoryResponse>("/generate-story", payload);
  return data;
}

export async function listVideos(skip = 0, limit = 20): Promise<VideoProject[]> {
  const { data } = await apiClient.get<VideoProject[]>(`/videos?skip=${skip}&limit=${limit}`);
  return data;
}

export async function getVideo(projectId: string): Promise<VideoProject> {
  const { data } = await apiClient.get<VideoProject>(`/videos/${projectId}`);
  return data;
}

export async function pollVideoStatus(
  projectId: string
): Promise<{ status: string; progress_percent: number; output_video_url: string | null; error_message: string | null }> {
  const { data } = await apiClient.get(`/videos/${projectId}/status`);
  return data;
}

export async function deleteVideo(projectId: string): Promise<void> {
  await apiClient.delete(`/videos/${projectId}`);
}
