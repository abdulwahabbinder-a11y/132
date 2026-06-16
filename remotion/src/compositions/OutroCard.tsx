import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const OutroCard: React.FC<{ topic: string }> = ({ topic }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, fps * 0.5, durationInFrames - fps * 0.5, durationInFrames],
    [0, 1, 1, 0]
  );

  return (
    <AbsoluteFill
      style={{
        background: "#000",
        color: "#fff",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, system-ui, sans-serif",
        opacity,
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.7 }}>Researched & narrated by</div>
      <div style={{ fontSize: 96, fontWeight: 800, marginTop: 16 }}>DocuGen AI</div>
      <div style={{ fontSize: 22, marginTop: 24, opacity: 0.5 }}>{topic}</div>
    </AbsoluteFill>
  );
};
