export type LanguageCode = "en" | "hi" | "ur" | "roman-urdu";

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
  generation_id: string;
  scenes: StoryScene[];
  credits_left: number;
  status: "queued";
};
