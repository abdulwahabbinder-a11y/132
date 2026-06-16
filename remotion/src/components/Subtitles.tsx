import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { WordTimestamp } from "../types";

/**
 * Center-bottom aligned clean subtitles, driven by ElevenLabs word timestamps.
 * Highlights the currently spoken word for a karaoke-style read-along.
 */
export const Subtitles: React.FC<{
  words: WordTimestamp[];
  narration: string;
}> = ({ words, narration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Fallback: no timestamps -> show full narration line.
  if (!words || words.length === 0) {
    return (
      <SubtitleBox>
        <span style={{ color: "#fff" }}>{narration}</span>
      </SubtitleBox>
    );
  }

  // Show a sliding window of up to ~8 words around the active word.
  const activeIndex = Math.max(
    0,
    words.findIndex((w) => t >= w.start && t <= w.end)
  );
  const windowStart = Math.max(0, activeIndex - 3);
  const visible = words.slice(windowStart, windowStart + 8);

  return (
    <SubtitleBox>
      {visible.map((w, i) => {
        const isActive = t >= w.start && t <= w.end;
        return (
          <span
            key={`${w.word}-${windowStart + i}`}
            style={{
              color: isActive ? "#ffb347" : "#ffffff",
              opacity: isActive ? 1 : 0.85,
              marginRight: 14,
              transition: "color 0.1s",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </SubtitleBox>
  );
};

const SubtitleBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      bottom: 80,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      padding: "0 12%",
    }}
  >
    <div
      style={{
        fontSize: 46,
        fontWeight: 700,
        textAlign: "center",
        lineHeight: 1.3,
        textShadow: "0 3px 18px rgba(0,0,0,0.9)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {children}
    </div>
  </div>
);
