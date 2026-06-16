export interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

export interface SceneManifest {
  sceneNumber: number;
  narrationText: string;
  visualKeywords: string[];
  clipPath: string | null;
  mapCoordinates: { latitude: number; longitude: number } | null;
  subtitles: SubtitleWord[];
}

export interface DocumentaryManifest {
  id: string;
  aspectRatio: "21:9";
  fps: number;
  scenes: SceneManifest[];
}
