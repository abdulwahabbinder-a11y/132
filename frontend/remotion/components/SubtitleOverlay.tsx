import { AbsoluteFill, useCurrentFrame } from "remotion";
import { WordTimestamp } from "../types";

interface Props {
  wordTimestamps: WordTimestamp[];
  fps: number;
  titleDuration: number;
}

const WORDS_PER_SUBTITLE = 7;

export const SubtitleOverlay: React.FC<Props> = ({ wordTimestamps, fps, titleDuration }) => {
  const frame = useCurrentFrame();

  // Convert current frame to ms (accounting for title card offset)
  const currentMs = Math.max(0, (frame - titleDuration) / fps) * 1000;

  // Find active subtitle block
  const getActiveBlock = (): string | null => {
    for (let i = 0; i < wordTimestamps.length; i += WORDS_PER_SUBTITLE) {
      const block = wordTimestamps.slice(i, i + WORDS_PER_SUBTITLE);
      if (!block.length) continue;
      const start = block[0].start_ms;
      const end = block[block.length - 1].end_ms;
      if (currentMs >= start && currentMs <= end) {
        return block.map((w) => w.word).join(" ");
      }
    }
    return null;
  };

  const activeText = getActiveBlock();

  if (!activeText) return null;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 60,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          borderRadius: 8,
          padding: "10px 24px",
          maxWidth: "80%",
        }}
      >
        <p
          style={{
            color: "white",
            fontSize: 28,
            fontFamily: "sans-serif",
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.4,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            margin: 0,
          }}
        >
          {activeText}
        </p>
      </div>
    </AbsoluteFill>
  );
};
