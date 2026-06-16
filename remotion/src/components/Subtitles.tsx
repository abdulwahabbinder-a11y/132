import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "../types";

/**
 * Centre-bottom aligned, word-synced subtitles driven by ElevenLabs word
 * timestamps. Groups words into short cues and highlights the active word.
 */
function groupCues(captions: Caption[], maxWords = 6, maxGap = 0.6): Caption[][] {
  const cues: Caption[][] = [];
  let bucket: Caption[] = [];
  for (const c of captions) {
    const last = bucket[bucket.length - 1];
    if (bucket.length >= maxWords || (last && c.start - last.end > maxGap)) {
      cues.push(bucket);
      bucket = [];
    }
    bucket.push(c);
  }
  if (bucket.length) cues.push(bucket);
  return cues;
}

export const Subtitles: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // scene-relative seconds

  if (!captions?.length) return null;
  const cues = groupCues(captions);
  const active = cues.find((cue) => t >= cue[0].start && t <= cue[cue.length - 1].end);
  if (!active) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 64,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          textAlign: "center",
          padding: "10px 22px",
          borderRadius: 14,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
        }}
      >
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 38,
            lineHeight: 1.25,
            color: "#fff",
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          {active.map((w, i) => {
            const isActive = t >= w.start && t <= w.end;
            return (
              <span
                key={i}
                style={{
                  color: isActive ? "#e6b34a" : "#fff",
                  transition: "color 0.1s",
                }}
              >
                {w.word}
                {i < active.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      </div>
    </AbsoluteFill>
  );
};
