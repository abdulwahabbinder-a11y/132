import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

/**
 * Slow procedural pan/zoom on a still image — the deterministic fallback used
 * when Wan2.1 / LivePortrait motion clips are unavailable.
 */
export const KenBurns: React.FC<{
  src: string;
  durationInFrames: number;
  direction?: "in" | "out";
}> = ({ src, durationInFrames, direction = "in" }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale =
    direction === "in"
      ? interpolate(progress, [0, 1], [1.05, 1.22])
      : interpolate(progress, [0, 1], [1.22, 1.05]);
  const translateX = interpolate(progress, [0, 1], [-2, 2]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#000" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${translateX}%)`,
        }}
      />
    </AbsoluteFill>
  );
};
