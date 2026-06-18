export interface SceneData {
  scene_number: number;
  narration_text: string;
  location_coordinates: {
    lat: number;
    lng: number;
    label?: string;
  } | null;
  video_path: string | null;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface CompositionProps {
  job_id: string;
  title: string;
  aspect_ratio: string;
  scenes: SceneData[];
  word_timestamps: WordTimestamp[];
  timeline_facts: Array<Record<string, unknown>>;
}

export const defaultProps: CompositionProps = {
  job_id: "demo",
  title: "Documentary Demo",
  aspect_ratio: "21:9",
  scenes: [
    {
      scene_number: 1,
      narration_text: "Welcome to DocuForge AI.",
      location_coordinates: { lat: 40.7128, lng: -74.006, label: "New York" },
      video_path: null,
    },
  ],
  word_timestamps: [
    { word: "Welcome", start: 0, end: 0.5 },
    { word: "to", start: 0.5, end: 0.7 },
    { word: "DocuForge", start: 0.7, end: 1.2 },
    { word: "AI.", start: 1.2, end: 1.5 },
  ],
  timeline_facts: [],
};
