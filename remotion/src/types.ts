export type WordTimestamp = {
  word: string;
  start_s: number;
  end_s: number;
};

export type SceneProps = {
  scene_number: number;
  narration_text: string;
  narration_audio_url: string | null;
  word_timestamps: WordTimestamp[];
  background_video_urls: string[];
  image_urls: string[];
  animated_clip_url: string | null;
  character_clip_url: string | null;
  abstract_image_url: string | null;
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: [number, number] | null;
};

export type MapWaypoint = {
  lng: number;
  lat: number;
  zoom: number;
  bearing: number;
  pitch: number;
};

export type DocumentaryProps = {
  title: string;
  scenes: SceneProps[];
  map_path: MapWaypoint[];
  mapbox_token: string;
};
