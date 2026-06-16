import { useCurrentFrame, useVideoConfig } from "remotion";
import type { WordTimestamp } from "./types";

export function Subtitles({ words }: { words: WordTimestamp[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const activeIndex = words.findIndex((word) => seconds >= word.start && seconds <= word.end);
  const windowStart = Math.max(0, activeIndex - 3);
  const visibleWords = activeIndex === -1 ? [] : words.slice(windowStart, activeIndex + 5);

  if (!visibleWords.length) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 78,
        transform: "translateX(-50%)",
        maxWidth: 1500,
        textAlign: "center",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
        fontSize: 46,
        fontWeight: 700,
        lineHeight: 1.18,
        letterSpacing: -0.8,
        color: "white",
        textShadow: "0 4px 18px rgba(0,0,0,0.95)"
      }}
    >
      {visibleWords.map((word, index) => {
        const isActive = windowStart + index === activeIndex;
        return (
          <span key={`${word.word}-${word.start}`} style={{ color: isActive ? "#7dd3fc" : "#ffffff" }}>
            {word.word}{" "}
          </span>
        );
      })}
    </div>
  );
}
