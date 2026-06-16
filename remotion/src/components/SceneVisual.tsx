import React from "react";
import { AbsoluteFill, OffthreadVideo, useVideoConfig } from "remotion";
import type { PrimaryVisual } from "../types";
import { resolveSrc } from "../lib/resolveSrc";
import { KenBurns } from "./KenBurns";

export const SceneVisual: React.FC<{
  visual: PrimaryVisual;
  durationInFrames: number;
  sceneNumber: number;
}> = ({ visual, durationInFrames, sceneNumber }) => {
  const { width, height } = useVideoConfig();
  const src = resolveSrc(visual.src);

  if (visual.kind === "video" && src) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <OffthreadVideo
          src={src}
          muted
          style={{ width, height, objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }

  if (visual.kind === "ken_burns" && src) {
    return (
      <KenBurns
        src={src}
        durationInFrames={durationInFrames}
        direction={sceneNumber % 2 === 0 ? "out" : "in"}
      />
    );
  }

  // Solid cinematic gradient fallback.
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 120% at 50% 0%, #1b1b27 0%, #0a0a0f 70%)",
      }}
    />
  );
};
