export type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

export type MediaAsset = {
  source: string;
  type: "image" | "video";
  url: string;
  full_url?: string;
  credit?: string | null;
  license?: string | null;
};

export type RemotionScene = {
  sceneNumber: number;
  narration: string;
  clipUrl?: string | null;
  audioUrl?: string | null;
  wordTimestamps: WordTimestamp[];
  mediaAssets: MediaAsset[];
  locationCoordinates?: [number, number] | null;
  isHistoricalCharacter: boolean;
  characterName?: string | null;
};

export type DocumentaryProps = {
  title: string;
  language: string;
  mapboxToken: string;
  scenes: RemotionScene[];
};
