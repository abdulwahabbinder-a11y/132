import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { WordTimestamp } from "../lib/types";

export function Subtitles({
  words,
  fallbackText
}: {
  words?: WordTimestamp[];
  fallbackText: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const activeWords = (words ?? []).filter((word) => {
    const start = word.start ?? 0;
    const end = word.end ?? start + 0.45;
    return time >= start && time <= end + 1.4;
  });
  const text =
    activeWords.length > 0
      ? activeWords.map((word) => word.word).join(" ")
      : fallbackText.split(" ").slice(0, 12).join(" ");
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp"
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 78,
        transform: "translateX(-50%)",
        width: 1500,
        textAlign: "center",
        opacity
      }}
    >
      <div
        style={{
          display: "inline-block",
          borderRadius: 18,
          background: "rgba(0,0,0,0.58)",
          padding: "16px 28px",
          color: "white",
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: -1,
          lineHeight: 1.15,
          textShadow: "0 3px 16px rgba(0,0,0,0.8)"
        }}
      >
        {text}
      </div>
    </div>
  );
}
