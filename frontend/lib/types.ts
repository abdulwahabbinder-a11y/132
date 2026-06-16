export type StoryScene = {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: { lat: number; lng: number } | null;
};

export type GenerateStoryResponse = {
  project_id: string;
  language_model: string;
  scenes: StoryScene[];
  video_credits_left: number;
};

export type Project = {
  id: string;
  topic: string;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
};
