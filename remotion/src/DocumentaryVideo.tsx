import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { DocumentaryProps } from "./types";
import { Scene } from "./components/Scene";

/**
 * Core Remotion composition. Lays each scene on the global timeline using its
 * start/duration (derived from ElevenLabs narration length on the backend).
 *
 * Motion.dev (Framer Motion) spring configs are passed through `scene.motion`
 * and consumed by the title/map components for smooth procedural transitions.
 */
export const DocumentaryVideo: React.FC<DocumentaryProps> = ({
  scenes,
  map_sequence,
  fps,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scenes.map((scene) => {
        const from = Math.round(scene.start * fps);
        const durationInFrames = Math.max(1, Math.round(scene.duration * fps));
        return (
          <Sequence
            key={scene.scene_number}
            from={from}
            durationInFrames={durationInFrames}
            name={`Scene ${scene.scene_number}`}
          >
            <Scene scene={scene} map={map_sequence} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
