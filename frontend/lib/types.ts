export type Language = "english" | "hindi" | "urdu" | "roman";

export interface Plan {
  id: string;
  name: string;
  price_usd: number;
  interval: string;
  credits: number;
  stripe_price_id?: string;
  features: string[];
}

export interface Subscription {
  plan_type: "free" | "pro";
  video_credits_left: number;
  billing_cycle_end?: string | null;
  status: string;
  stripe_customer_id?: string | null;
}

export type JobStatus =
  | "pending"
  | "scripting"
  | "scraping"
  | "voicing"
  | "animating"
  | "assembling"
  | "rendering"
  | "completed"
  | "failed";

export interface VideoJob {
  id: string;
  topic: string;
  language: string;
  status: JobStatus;
  progress: number;
  output_url?: string | null;
  error_message?: string | null;
  created_at?: string | null;
}

export interface Scene {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name?: string | null;
  location_coordinates?: { lat: number; lng: number; label?: string } | null;
}

export interface GenerateStoryResponse {
  job_id: string;
  script: { topic: string; language: Language; scenes: Scene[] };
  credits_left: number;
}
