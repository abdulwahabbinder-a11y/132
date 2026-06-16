import type { DocumentaryProps } from "./types";

// Sample props so the Remotion Studio preview renders without the backend.
export const defaultProps: DocumentaryProps = {
  fps: 24,
  width: 2560,
  height: 1097,
  durationInFrames: 24 * 12,
  topic: "The fall of the Berlin Wall",
  language: "english",
  map_sequence: {
    mapbox_token: "",
    style: "mapbox://styles/mapbox/dark-v11",
    fly_to_duration_s: 2,
    zoom: 5,
    waypoints: [
      { scene_number: 1, lat: 52.52, lng: 13.405, label: "Berlin" },
      { scene_number: 3, lat: 48.8566, lng: 2.3522, label: "Paris" },
    ],
  },
  scenes: [
    {
      scene_number: 1,
      start: 0,
      duration: 6,
      narration_text:
        "In 1989, a wall that had divided a city for decades was about to fall.",
      is_abstract_scene: false,
      is_historical_character: false,
      character_name: null,
      location_coordinates: { lat: 52.52, lng: 13.405, label: "Berlin" },
      primary_visual: { kind: "solid", src: null },
      audio_src: null,
      captions: [
        { word: "In", start: 0, end: 0.3 },
        { word: "1989,", start: 0.3, end: 1.0 },
        { word: "a", start: 1.0, end: 1.1 },
        { word: "wall", start: 1.1, end: 1.6 },
        { word: "would", start: 1.6, end: 2.0 },
        { word: "fall.", start: 2.0, end: 2.8 },
      ],
      motion: {
        enter: { type: "spring", stiffness: 120, damping: 18 },
        transition_sfx: "whoosh",
      },
    },
    {
      scene_number: 2,
      start: 6,
      duration: 6,
      narration_text: "But the idea of freedom had been growing for years.",
      is_abstract_scene: true,
      is_historical_character: false,
      character_name: null,
      location_coordinates: null,
      primary_visual: { kind: "solid", src: null },
      audio_src: null,
      captions: [
        { word: "The", start: 0, end: 0.3 },
        { word: "idea", start: 0.3, end: 0.9 },
        { word: "of", start: 0.9, end: 1.0 },
        { word: "freedom.", start: 1.0, end: 1.9 },
      ],
      motion: {
        enter: { type: "spring", stiffness: 120, damping: 18 },
        transition_sfx: "deep_boom",
      },
    },
  ],
};
