import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { motion } from "framer-motion";

interface Props {
  topic: string;
  language: string;
}

export const TitleCard: React.FC<Props> = ({ topic, language }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, fps * 0.6, fps * 3.4, fps * 4], [0, 1, 1, 0]);
  const y = interpolate(frame, [0, fps * 0.8], [40, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, #111 0%, #000 80%)",
        color: "#fff",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <motion.div style={{ opacity, transform: `translateY(${y}px)` }}>
        <div style={{ fontSize: 28, letterSpacing: 6, opacity: 0.7, textTransform: "uppercase" }}>
          A DocuGen Original · {language.toUpperCase()}
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, marginTop: 24 }}>{topic}</div>
        <div
          style={{
            width: 220,
            height: 3,
            margin: "32px auto",
            background: "linear-gradient(90deg, transparent, #fff, transparent)",
          }}
        />
      </motion.div>
    </AbsoluteFill>
  );
};
