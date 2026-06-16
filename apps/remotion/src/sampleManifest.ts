import type { DocumentaryRenderManifest } from "./types";

export const sampleManifest: DocumentaryRenderManifest = {
  generation_id: "00000000-0000-0000-0000-000000000000",
  topic: "Sample documentary",
  language: "en",
  aspect_ratio: "21:9",
  mapbox_access_token: null,
  scenes: [
    {
      scene: {
        scene_number: 1,
        narration_text: "A trade route becomes a map of power, faith, and risk.",
        visual_keywords: ["silk road", "ancient trade", "desert caravan"],
        is_abstract_scene: false,
        is_historical_character: false,
        character_name: null,
        location_coordinates: { lat: 41.0082, lng: 28.9784 }
      },
      facts: [],
      assets: [],
      voiceover: {
        scene_number: 1,
        audio_path: "",
        word_timestamps: [
          { word: "A", start: 0, end: 0.1 },
          { word: "trade", start: 0.1, end: 0.4 },
          { word: "route", start: 0.4, end: 0.75 },
          { word: "becomes", start: 0.75, end: 1.2 },
          { word: "power.", start: 1.2, end: 1.8 }
        ]
      },
      cinematic_clip_path: null
    }
  ]
};
