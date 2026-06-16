import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { motion } from "framer-motion";

export const AnimatedTitle: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const opacity = interpolate(t, [0, 0.4, 2.4, 3], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <motion.h1
        initial={{ letterSpacing: -10, opacity: 0 }}
        animate={{ letterSpacing: 2, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 160,
          fontWeight: 800,
          color: "#fff",
          textAlign: "center",
          maxWidth: "80%",
          textShadow: "0 12px 60px rgba(0,0,0,0.8)",
        }}
      >
        {title}
      </motion.h1>
    </AbsoluteFill>
  );
};
