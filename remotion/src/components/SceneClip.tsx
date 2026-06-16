import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import type { SceneData } from "./types";

interface SceneClipProps {
  scene: SceneData;
  durationInFrames: number;
}

export const SceneClip: React.FC<SceneClipProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  const kenBurnsScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    extrapolateRight: "clamp",
  });

  const kenBurnsX = interpolate(frame, [0, durationInFrames], [0, -20], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {scene.video_path ? (
        <Video
          src={scene.video_path}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${kenBurnsScale}) translateX(${kenBurnsX}px)`,
            opacity: entrance,
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            opacity: entrance,
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)",
        }}
      />
    </AbsoluteFill>
  );
};
