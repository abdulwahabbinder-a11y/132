export type Caption = {
  word: string;
  start: number; // seconds, scene-relative
  end: number;
};

export type PrimaryVisual = {
  kind: "video" | "ken_burns" | "solid";
  src: string | null;
};

export type LocationCoordinates = {
  lat: number;
  lng: number;
  label?: string | null;
};

export type MotionConfig = {
  enter: { type: string; stiffness: number; damping: number };
  transition_sfx: "whoosh" | "deep_boom";
};

export type SceneProps = {
  scene_number: number;
  start: number; // seconds on global timeline
  duration: number; // seconds
  narration_text: string;
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name?: string | null;
  location_coordinates?: LocationCoordinates | null;
  primary_visual: PrimaryVisual;
  audio_src?: string | null;
  captions: Caption[];
  motion: MotionConfig;
};

export type MapWaypoint = LocationCoordinates & {
  scene_number: number;
};

export type MapSequence = {
  mapbox_token: string;
  style: string;
  fly_to_duration_s: number;
  zoom: number;
  waypoints: MapWaypoint[];
};

export type DocumentaryProps = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  topic: string;
  language: string;
  scenes: SceneProps[];
  map_sequence: MapSequence;
  subtitles_srt?: string;
};
