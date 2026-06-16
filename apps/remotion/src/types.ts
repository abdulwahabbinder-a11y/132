export type StoryScene = {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: { lat: number; lng: number } | null;
};

export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

export type VoiceoverResult = {
  scene_number: number;
  audio_path: string;
  word_timestamps: WordTimestamp[];
};

export type MediaAsset = {
  scene_number: number;
  provider: string;
  asset_type: "image" | "video" | "audio" | "metadata";
  url: string | null;
  local_path: string | null;
  attribution: string | null;
  metadata: Record<string, unknown>;
};

export type SceneRenderManifest = {
  scene: StoryScene;
  facts: Array<{ title: string; source_url: string; summary: string; timestamp: string | null }>;
  assets: MediaAsset[];
  voiceover: VoiceoverResult | null;
  cinematic_clip_path: string | null;
};

export type DocumentaryRenderManifest = {
  generation_id: string;
  topic: string;
  language: string;
  scenes: SceneRenderManifest[];
  mapbox_access_token: string | null;
  aspect_ratio: string;
};
