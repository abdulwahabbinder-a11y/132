import { Composition } from "remotion";

import { DocumentaryComposition, type DocumentaryCompositionProps } from "@/remotion/DocumentaryComposition";

const defaultProps: DocumentaryCompositionProps = {
  projectId: "demo-project",
  aspectRatio: "21:9",
  scenes: [
    {
      scene_number: 1,
      narration_text: "The story opens over Alexandria, where knowledge once gathered under one roof.",
      visual_keywords: ["ancient library", "alexandria coastline", "papyrus manuscripts"],
      is_abstract_scene: false,
      is_historical_character: false,
      character_name: null,
      location_coordinates: { latitude: 31.2001, longitude: 29.9187 },
      stockMedia: [],
      archivalMedia: [],
      generatedMedia: null,
    },
    {
      scene_number: 2,
      narration_text: "As empires collided, the library became a symbol of power, myth, and memory.",
      visual_keywords: ["roman empire", "historical fire", "scholars"],
      is_abstract_scene: true,
      is_historical_character: false,
      character_name: null,
      location_coordinates: null,
      stockMedia: [],
      archivalMedia: [],
      generatedMedia: null,
    },
  ],
  subtitleTracks: [
    {
      sceneNumber: 1,
      timestamps: {
        characters: ["T", "h", "e"],
        character_start_times_seconds: [0, 0.1, 0.2],
        character_end_times_seconds: [0.1, 0.2, 0.3],
      },
    },
  ],
  audioDucking: { backgroundMusicGain: 0.15, voiceGain: 1 },
  transitionSfx: ["whoosh", "deep-boom"],
};

export const RemotionRoot = () => (
  <Composition
    id="DocumentaryComposition"
    component={(props) => (
      <DocumentaryComposition {...(props as unknown as DocumentaryCompositionProps)} />
    )}
    durationInFrames={900}
    fps={30}
    width={2520}
    height={1080}
    defaultProps={defaultProps}
  />
);
