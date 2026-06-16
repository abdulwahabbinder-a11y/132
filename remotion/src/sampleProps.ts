import type { DocumentaryProps } from "./types";

/**
 * Default props so the composition renders in Remotion Studio without a backend.
 * In production these are replaced by the backend via `--props`.
 */
export const sampleProps: DocumentaryProps = {
  title: "The Fall of Constantinople",
  language: "english",
  mapboxToken: "",
  scenes: [
    {
      sceneNumber: 1,
      narration:
        "In the spring of 1453, the last embers of the Roman Empire flickered behind ancient walls.",
      clipUrl: null,
      audioUrl: null,
      wordTimestamps: [],
      mediaAssets: [
        {
          source: "wikimedia_commons",
          type: "image",
          url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Siege_constantinople_bnf_fr2691.jpg/1280px-Siege_constantinople_bnf_fr2691.jpg",
        },
      ],
      locationCoordinates: [28.9784, 41.0082],
      isHistoricalCharacter: false,
      characterName: null,
    },
    {
      sceneNumber: 2,
      narration:
        "Sultan Mehmed II was just twenty-one, yet his ambition would reshape the world.",
      clipUrl: null,
      audioUrl: null,
      wordTimestamps: [],
      mediaAssets: [],
      locationCoordinates: null,
      isHistoricalCharacter: true,
      characterName: "Mehmed II",
    },
  ],
};
