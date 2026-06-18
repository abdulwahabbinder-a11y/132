export interface ViralSceneData {
  scene_number: number;
  image_path: string;
  audio_path: string;
  on_screen_text: string;
  duration_seconds: number;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface ViralShortProps {
  title: string;
  hook: string;
  aspect_ratio: string;
  scenes: ViralSceneData[];
  word_timestamps: WordTimestamp[];
}

export const defaultViralProps: ViralShortProps = {
  title: "Viral Short Demo",
  hook: "You won't believe this...",
  aspect_ratio: "9:16",
  scenes: [
    {
      scene_number: 1,
      image_path: "",
      audio_path: "",
      on_screen_text: "WAIT FOR IT",
      duration_seconds: 4,
    },
  ],
  word_timestamps: [
    { word: "You", start: 0, end: 0.3 },
    { word: "won't", start: 0.3, end: 0.6 },
    { word: "believe", start: 0.6, end: 1.0 },
    { word: "this", start: 1.0, end: 1.3 },
  ],
};
