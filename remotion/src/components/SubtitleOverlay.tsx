import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { WordTimestamp } from "../types";

interface SubtitleOverlayProps {
  wordTimestamps: WordTimestamp[];
  currentTimeSeconds: number;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  wordTimestamps,
  currentTimeSeconds,
}) => {
  const frame = useCurrentFrame();

  const activeWords = wordTimestamps.filter(
    (w) => w.start <= currentTimeSeconds && w.end >= currentTimeSeconds
  );

  const contextStart = Math.max(
    0,
    wordTimestamps.findIndex((w) => w.start <= currentTimeSeconds)
  );
  const displayWords = wordTimestamps.slice(
    Math.max(0, contextStart - 2),
    contextStart + 8
  );

  const fadeIn = interpolate(frame % 30, [0, 10], [0.7, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 48,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          textAlign: "center",
          opacity: fadeIn,
        }}
      >
        <p
          style={{
            color: "#ffffff",
            fontSize: 32,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            lineHeight: 1.4,
            textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)",
            margin: 0,
          }}
        >
          {displayWords.map((w, i) => {
            const isActive = activeWords.some((aw) => aw.word === w.word && aw.start === w.start);
            return (
              <span
                key={`${w.word}-${w.start}-${i}`}
                style={{
                  color: isActive ? "#f1faee" : "#ffffff",
                  fontWeight: isActive ? 700 : 500,
                  opacity: isActive ? 1 : 0.85,
                }}
              >
                {w.word}{" "}
              </span>
            );
          })}
        </p>
      </div>
    </AbsoluteFill>
  );
};
