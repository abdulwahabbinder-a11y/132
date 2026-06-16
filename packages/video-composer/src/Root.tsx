import { Composition } from "remotion";

import { DocumentaryComposition } from "./DocumentaryComposition";
import type { DocumentaryManifest } from "./types";

const defaultManifest: DocumentaryManifest = {
  id: "demo",
  aspectRatio: "21:9",
  fps: 30,
  scenes: [
    {
      sceneNumber: 1,
      narrationText: "A generated documentary scene will appear here once the backend dispatches a render.",
      visualKeywords: ["documentary", "timeline", "world map"],
      clipPath: null,
      mapCoordinates: { latitude: 41.0082, longitude: 28.9784 },
      subtitles: [{ text: "Preview", start: 0, end: 2 }],
    },
  ],
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="DocumentaryTimeline"
      component={DocumentaryComposition}
      durationInFrames={defaultManifest.scenes.length * 120}
      fps={30}
      width={2520}
      height={1080}
      defaultProps={{ manifest: defaultManifest }}
    />
  );
};
