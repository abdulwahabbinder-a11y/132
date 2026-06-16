import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { motion } from "framer-motion";
import { WordTimestamp } from "../types";

type Props = {
  words: WordTimestamp[];
  maxCharsPerLine?: number;
};

export const Subtitle: React.FC<Props> = ({ words, maxCharsPerLine = 42 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tSec = frame / fps;

  const chunks = chunkByChars(words, maxCharsPerLine);
  const active = chunks.find(
    (c) => tSec >= c[0].start_s && tSec <= c[c.length - 1].end_s
  );
  if (!active) return null;

  const text = active.map((w) => w.word).join(" ");

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 90,
        pointerEvents: "none",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontWeight: 700,
          fontSize: 52,
          color: "#fff",
          padding: "14px 28px",
          borderRadius: 10,
          background: "rgba(0, 0, 0, 0.55)",
          textShadow: "0 2px 6px rgba(0,0,0,0.85)",
          letterSpacing: 0.2,
          maxWidth: "85%",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {text}
      </motion.div>
    </AbsoluteFill>
  );
};

function chunkByChars(words: WordTimestamp[], maxChars: number): WordTimestamp[][] {
  const out: WordTimestamp[][] = [];
  let cur: WordTimestamp[] = [];
  let count = 0;
  for (const w of words) {
    const inc = w.word.length + 1;
    if (count + inc > maxChars && cur.length > 0) {
      out.push(cur);
      cur = [];
      count = 0;
    }
    cur.push(w);
    count += inc;
  }
  if (cur.length) out.push(cur);
  return out;
}
