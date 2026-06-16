export type PlanType = "free" | "pro";
export type JobStatus =
  | "queued"
  | "gathering_facts"
  | "downloading_assets"
  | "synthesizing_audio"
  | "animating_scenes"
  | "rendering_video"
  | "completed"
  | "failed";

export type SupportedLanguage = "english" | "hindi" | "urdu" | "roman-urdu" | "roman";

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface DocumentaryScene {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: LocationCoordinates | null;
}

export interface StoryGenerationRequest {
  topic: string;
  language: SupportedLanguage;
  target_duration_seconds: number;
  cinematic_tone: string;
}

export interface StoryGenerationResponse {
  job_id: string;
  remaining_credits: number;
  story: DocumentaryScene[];
}

export interface SubscriptionSummary {
  plan_type: PlanType;
  video_credits_left: number;
  billing_cycle_end: string | null;
}

export interface JobResponse {
  id: string;
  topic: string;
  language: string;
  status: JobStatus;
  story_json: { story: DocumentaryScene[] };
  asset_manifest: Record<string, unknown> | null;
  subtitles_json: Record<string, unknown> | null;
  render_url: string | null;
  error_message: string | null;
  completed_at: string | null;
}
