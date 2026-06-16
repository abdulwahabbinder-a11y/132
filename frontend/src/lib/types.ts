export type PlanType = "free" | "pro";

export type VideoStatus =
  | "queued"
  | "scripting"
  | "scraping"
  | "generating_media"
  | "synthesising"
  | "assembling"
  | "rendering"
  | "completed"
  | "failed";

export interface Account {
  id: string;
  email: string;
  full_name?: string | null;
  plan_type: PlanType;
  video_credits_left: number;
  billing_cycle_end?: string | null;
}

export interface Scene {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name?: string | null;
  location_coordinates?: [number, number] | null;
  audio_url?: string | null;
  clip_url?: string | null;
}

export interface VideoSummary {
  id: string;
  topic: string;
  language: string;
  status: VideoStatus;
  progress: number;
  output_url?: string | null;
  created_at?: string;
}

export interface VideoDetail extends VideoSummary {
  scenes: Scene[];
}

export type ScriptLanguage = "english" | "hindi" | "urdu" | "roman";

export interface GenerateStoryRequest {
  topic: string;
  language: ScriptLanguage;
  target_scene_count: number;
  style_reference?: string;
}

export interface GenerateStoryResponse {
  video_id: string;
  status: string;
  credits_left: number;
  script: {
    title: string;
    language: ScriptLanguage;
    scenes: Scene[];
  };
}
