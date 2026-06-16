import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ViralSceneClip } from "./components/ViralSceneClip";
import { ViralSubtitleOverlay } from "./components/ViralSubtitleOverlay";
import type { ViralShortProps } from "./viralTypes";

export const ViralShortComposition: React.FC<ViralShortProps> = ({
  title,
  hook,
  scenes,
  word_timestamps,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTimeSeconds = frame / fps;

  let frameOffset = 0;
  const titleOpacity = interpolate(frame, [0, 20, 50], [0, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scenes.map((scene) => {
        const durationFrames = Math.round(scene.duration_seconds * fps);
        const from = frameOffset;
        frameOffset += durationFrames;

        return (
          <Sequence key={scene.scene_number} from={from} durationInFrames={durationFrames}>
            <ViralSceneClip scene={scene} durationInFrames={durationFrames} />
          </Sequence>
        );
      })}

      <ViralSubtitleOverlay
        wordTimestamps={word_timestamps}
        currentTimeSeconds={currentTimeSeconds}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: 120,
          opacity: titleOpacity,
          pointerEvents: "none",
        }}
      >
        <div style={{ textAlign: "center", padding: "0 40px" }}>
          <p
            style={{
              color: "#FFD700",
              fontSize: 28,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            {hook}
          </p>
          <h1
            style={{
              color: "#fff",
              fontSize: 42,
              fontWeight: 900,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {title}
          </h1>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
