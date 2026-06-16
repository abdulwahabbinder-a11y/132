import { AbsoluteFill, Sequence } from "remotion";
import { SceneComposition } from "./SceneComposition";
import type { DocumentaryRenderManifest, SceneRenderManifest } from "./types";

export const FPS = 30;
export const WIDTH = 2560;
export const HEIGHT = 1098;

export function Documentary({ manifest }: { manifest: DocumentaryRenderManifest }) {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#050712" }}>
      {manifest.scenes.map((sceneManifest) => {
        const duration = getSceneDurationFrames(sceneManifest);
        const from = cursor;
        cursor += duration;
        return (
          <Sequence key={sceneManifest.scene.scene_number} from={from} durationInFrames={duration}>
            <SceneComposition sceneManifest={sceneManifest} mapboxToken={manifest.mapbox_access_token} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

export function getSceneDurationFrames(sceneManifest: SceneRenderManifest): number {
  const words = sceneManifest.voiceover?.word_timestamps ?? [];
  const finalWordEnd = words.reduce((max, word) => Math.max(max, word.end), 0);
  return Math.max(Math.ceil((finalWordEnd + 1.1) * FPS), 120);
}

export function getDocumentaryDurationFrames(manifest: DocumentaryRenderManifest): number {
  return manifest.scenes.reduce((total, scene) => total + getSceneDurationFrames(scene), 0);
}
