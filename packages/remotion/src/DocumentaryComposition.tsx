import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFrame } from "./components/SceneFrame";
import type { DocumentaryRenderPayload } from "./lib/types";

const FRAMES_PER_SCENE = 120;

export function DocumentaryComposition({
  topic,
  scenes,
  jobId
}: DocumentaryRenderPayload) {
  const mapboxToken = process.env.MAPBOX_TOKEN;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05060a" }}>
      {scenes.map((scene, index) => (
        <Sequence
          key={`${jobId}-${scene.scene_number}`}
          from={index * FRAMES_PER_SCENE}
          durationInFrames={FRAMES_PER_SCENE}
        >
          <SceneFrame scene={scene} topic={topic} mapboxToken={mapboxToken} />
          {scene.assets?.narration?.audio_url ? (
            <Audio src={resolveAudioSource(scene.assets.narration.audio_url)} />
          ) : null}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

export function getDurationInFrames(scenes: DocumentaryRenderPayload["scenes"]) {
  return Math.max(scenes.length, 1) * FRAMES_PER_SCENE;
}

function resolveAudioSource(source: string) {
  if (source.startsWith("http://") || source.startsWith("https://") || source.startsWith("/")) {
    return source;
  }
  return staticFile(source);
}
