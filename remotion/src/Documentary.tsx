import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { SceneRenderer } from "./compositions/SceneRenderer";
import { TitleCard } from "./compositions/TitleCard";
import { OutroCard } from "./compositions/OutroCard";
import type { DocumentaryProps } from "./types";

const TITLE_SECONDS = 4;
const OUTRO_SECONDS = 3;

export const Documentary: React.FC<DocumentaryProps> = (props) => {
  const { fps } = useVideoConfig();

  let cursor = 0;
  const titleFrames = TITLE_SECONDS * fps;
  cursor += titleFrames;

  const sceneSegments = props.scenes.map((scene) => {
    const align = scene.narration_alignment;
    const last = align?.character_end_times_seconds?.slice(-1)?.[0] ?? 8;
    const seconds = Math.max(4, last + 0.3);
    const start = cursor;
    cursor += Math.round(seconds * fps);
    return {
      scene,
      from: start,
      durationInFrames: Math.round(seconds * fps),
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={titleFrames}>
        <TitleCard topic={props.topic} language={props.language} />
      </Sequence>

      {sceneSegments.map(({ scene, from, durationInFrames }) => (
        <Sequence
          key={scene.scene_number}
          from={from}
          durationInFrames={durationInFrames}
        >
          <SceneRenderer scene={scene} mapboxToken={props.mapbox_token} />
        </Sequence>
      ))}

      <Sequence from={cursor} durationInFrames={OUTRO_SECONDS * fps}>
        <OutroCard topic={props.topic} />
      </Sequence>
    </AbsoluteFill>
  );
};
