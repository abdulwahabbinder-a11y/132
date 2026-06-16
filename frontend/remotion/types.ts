export interface LocationCoordinates {
  lat: number;
  lng: number;
  zoom: number;
  label: string;
}

export interface WordTimestamp {
  word: string;
  start_ms: number;
  end_ms: number;
}

export interface SceneData {
  id: string;
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: LocationCoordinates | null;
  image_url: string | null;
  video_clip_url: string | null;
  final_clip_url: string | null;
  start_time_ms: number;
  end_time_ms: number;
}

export interface DocumentaryVideoProps {
  title: string;
  scenes: SceneData[];
  word_timestamps: WordTimestamp[];
  aspect_ratio: "21:9" | "16:9" | "9:16";
  fps: number;
  duration_in_frames: number;
  background_music_url?: string;
}
