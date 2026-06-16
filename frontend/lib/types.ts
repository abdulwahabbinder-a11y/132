export type GeneratedScene = {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: string;
};

export type GenerateStoryResponse = {
  job_id: string;
  credits_left: number;
  scenes: GeneratedScene[];
};

export type JobStatusResponse = {
  job_id: string;
  status: string;
  output_video_url: string | null;
  error_message: string | null;
};
