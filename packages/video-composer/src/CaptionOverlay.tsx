import { useCurrentFrame, useVideoConfig } from "remotion";

import type { SubtitleWord } from "./types";

export function CaptionOverlay({ words }: { words: SubtitleWord[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const activeLine = words.filter((word) => currentTime >= word.start && currentTime <= word.end + 0.35);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 44,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 96px",
      }}
    >
      <div
        style={{
          maxWidth: "74%",
          borderRadius: 28,
          background: "rgba(5, 10, 20, 0.72)",
          padding: "16px 24px",
          fontSize: 34,
          lineHeight: 1.35,
          color: "white",
          fontWeight: 600,
          textAlign: "center",
          letterSpacing: "-0.02em",
          boxShadow: "0 18px 60px rgba(0, 0, 0, 0.35)",
        }}
      >
        {activeLine.length ? activeLine.map((word) => word.text).join(" ") : " "}
      </div>
    </div>
  );
}
