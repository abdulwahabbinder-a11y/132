import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { ViralSceneData } from "../viralTypes";

interface ViralSceneClipProps {
  scene: ViralSceneData;
  durationInFrames: number;
}

export const ViralSceneClip: React.FC<ViralSceneClipProps> = ({
  scene,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 200, stiffness: 120 } });
  const scale = interpolate(frame, [0, durationInFrames], [1.05, 1.0], {
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [0, 15], [30, 0], { extrapolateRight: "clamp" });

  const imageSrc = scene.image_path.startsWith("/")
    ? scene.image_path
    : scene.image_path;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scene.image_path && (
        <Img
          src={imageSrc}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            opacity: entrance,
          }}
        />
      )}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {scene.on_screen_text && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 48px",
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontSize: 56,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 900,
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              textShadow: "0 4px 24px rgba(0,0,0,0.9)",
              transform: `translateY(${textY}px)`,
              opacity: entrance,
            }}
          >
            {scene.on_screen_text}
          </h2>
        </AbsoluteFill>
      )}

      {scene.audio_path && <Audio src={scene.audio_path} />}
    </AbsoluteFill>
  );
};
