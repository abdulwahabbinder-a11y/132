import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface Cue {
  text: string;
  start: number;
  end: number;
}

const MAX_CHARS = 42;
const MAX_SECONDS = 3.5;

function buildCues(alignment: Alignment): Cue[] {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } =
    alignment;
  const cues: Cue[] = [];
  let buf: string[] = [];
  let cueStart: number | null = null;
  let cueEnd = 0;

  const flush = () => {
    if (buf.length && cueStart !== null) {
      const text = buf.join("").trim();
      if (text) cues.push({ text, start: cueStart, end: cueEnd });
    }
    buf = [];
    cueStart = null;
  };

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    const s = starts[i] ?? 0;
    const e = ends[i] ?? s;
    if (cueStart === null) cueStart = s;
    buf.push(ch);
    cueEnd = e;
    const tooLong = buf.join("").length >= MAX_CHARS;
    const tooSlow = e - cueStart >= MAX_SECONDS;
    const sentenceEnd = ".?!".includes(ch) && buf.join("").trim().length > 8;
    if (tooLong || tooSlow || sentenceEnd) flush();
  }
  flush();
  return cues;
}

interface Props {
  alignment: Alignment;
  t: number;
}

export const Subtitle: React.FC<Props> = ({ alignment, t }) => {
  const cues = useMemo(() => buildCues(alignment), [alignment]);
  const active = cues.find((c) => t >= c.start && t <= c.end);
  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 110,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        <motion.div
          key={active.start}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{
            maxWidth: "70%",
            padding: "14px 26px",
            background: "rgba(0,0,0,0.62)",
            color: "#fff",
            borderRadius: 6,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 38,
            lineHeight: 1.25,
            letterSpacing: 0.2,
            textAlign: "center",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          {active.text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
