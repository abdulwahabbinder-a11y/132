export type LocationCoordinates = {
  latitude: number;
  longitude: number;
  label?: string | null;
};

export type WordTimestamp = {
  word: string;
  start?: number | null;
  end?: number | null;
};

export type DocumentaryScene = {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name?: string | null;
  location_coordinates?: LocationCoordinates | null;
  assets?: {
    primary_visual_asset?: string | null;
    narration?: {
      audio_url?: string | null;
      timestamps?: WordTimestamp[];
    };
    character_render?: {
      final_character_clip?: string | null;
    } | null;
    animated_clip?: Record<string, unknown> | null;
  };
};

export type DocumentaryRenderPayload = {
  jobId: string;
  topic: string;
  language: string;
  aspectRatio: "21:9";
  backgroundMusic?: {
    duckingAmount: number;
    transitionSfx: string[];
  };
  scenes: DocumentaryScene[];
};

export const defaultPayload: DocumentaryRenderPayload = {
  jobId: "preview",
  topic: "The hidden history of documentary cinema",
  language: "english",
  aspectRatio: "21:9",
  backgroundMusic: {
    duckingAmount: 0.85,
    transitionSfx: ["whoosh", "deep-boom"]
  },
  scenes: [
    {
      scene_number: 1,
      narration_text:
        "In the beginning, a simple image could change how millions understood the world.",
      visual_keywords: ["archive", "film reel", "cinema"],
      is_abstract_scene: false,
      is_historical_character: false,
      character_name: null,
      location_coordinates: {
        latitude: 40.7128,
        longitude: -74.006,
        label: "New York"
      },
      assets: {
        narration: {
          timestamps: [
            { word: "In", start: 0, end: 0.2 },
            { word: "the", start: 0.2, end: 0.4 },
            { word: "beginning,", start: 0.4, end: 0.9 }
          ]
        }
      }
    }
  ]
};
