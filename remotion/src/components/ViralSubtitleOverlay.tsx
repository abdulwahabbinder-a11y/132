import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { WordTimestamp } from "../viralTypes";

interface ViralSubtitleOverlayProps {
  wordTimestamps: WordTimestamp[];
  currentTimeSeconds: number;
}

export const ViralSubtitleOverlay: React.FC<ViralSubtitleOverlayProps> = ({
  wordTimestamps,
  currentTimeSeconds,
}) => {
  const frame = useCurrentFrame();

  const activeIdx = wordTimestamps.findIndex(
    (w) => w.start <= currentTimeSeconds && w.end >= currentTimeSeconds
  );
  const displayWords = wordTimestamps.slice(
    Math.max(0, activeIdx - 1),
    activeIdx + 5
  );

  const pulse = interpolate(frame % 20, [0, 10, 20], [1, 1.05, 1]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 180,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.75)",
          borderRadius: 12,
          padding: "16px 28px",
          maxWidth: "90%",
          transform: `scale(${pulse})`,
        }}
      >
        <p
          style={{
            color: "#fff",
            fontSize: 36,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 700,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {displayWords.map((w, i) => {
            const isActive =
              w.start <= currentTimeSeconds && w.end >= currentTimeSeconds;
            return (
              <span
                key={`${w.word}-${w.start}`}
                style={{
                  color: isActive ? "#FFD700" : "#fff",
                  marginRight: 8,
                }}
              >
                {w.word}
              </span>
            );
          })}
        </p>
      </div>
    </AbsoluteFill>
  );
};
