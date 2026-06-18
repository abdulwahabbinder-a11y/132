import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MapSequence } from "./components/MapSequence";
import { SceneClip } from "./components/SceneClip";
import { SubtitleOverlay } from "./components/SubtitleOverlay";
// Motion.dev (Framer Motion) spring configs are used in SceneClip via Remotion's spring()
import type { CompositionProps } from "./types";

const SCENE_DURATION_SECONDS = 6;
const MAP_OVERLAY_SECONDS = 3;

export const DocumentaryComposition: React.FC<CompositionProps> = ({
  title,
  scenes,
  word_timestamps,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTimeSeconds = frame / fps;

  const sceneDurationFrames = SCENE_DURATION_SECONDS * fps;
  const mapDurationFrames = MAP_OVERLAY_SECONDS * fps;

  const titleOpacity = interpolate(frame, [0, 30, 60], [0, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scenes.map((scene, index) => {
        const startFrame = index * sceneDurationFrames;
        const hasMap = scene.location_coordinates !== null;

        return (
          <React.Fragment key={scene.scene_number}>
            <Sequence from={startFrame} durationInFrames={sceneDurationFrames}>
              <SceneClip scene={scene} durationInFrames={sceneDurationFrames} />
            </Sequence>

            {hasMap && (
              <Sequence
                from={startFrame + sceneDurationFrames - mapDurationFrames}
                durationInFrames={mapDurationFrames}
              >
                <MapSequence scene={scene} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}

      <SubtitleOverlay
        wordTimestamps={word_timestamps}
        currentTimeSeconds={currentTimeSeconds}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: titleOpacity,
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontSize: 64,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 24px rgba(0,0,0,0.8)",
          }}
        >
          {title}
        </h1>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
