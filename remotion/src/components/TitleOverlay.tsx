import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { MotionConfig } from "../types";

/**
 * Typographic overlay for character name / chapter title, animated with
 * Motion.dev-style spring config passed through from the backend timeline.
 */
export const TitleOverlay: React.FC<{
  text: string;
  motion: MotionConfig;
}> = ({ text, motion }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: {
      stiffness: motion.enter.stiffness,
      damping: motion.enter.damping,
    },
  });
  const y = interpolate(enter, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "flex-start", padding: 64 }}>
      <div
        style={{
          transform: `translateY(${y}px)`,
          opacity: enter,
          padding: "10px 20px",
          borderLeft: "4px solid #e6b34a",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: 40,
            color: "#fff",
            letterSpacing: -0.5,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
