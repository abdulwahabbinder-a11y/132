import React from "react";
import { AbsoluteFill, Sequence, Series } from "remotion";
import type { DocumentaryProps } from "./types";
import { TRANSITION_FRAMES, FPS } from "./constants";
import { sceneDurationInFrames } from "./utils/timing";
import { SceneRenderer } from "./scenes/SceneRenderer";
import { TitleOverlay } from "./components/TitleOverlay";

/**
 * Top-level documentary composition. Sequences each scene back-to-back with a
 * brief title card intro. Motion.dev (Framer Motion) drives typographic layout
 * transitions inside the overlays; Remotion owns the timeline + render.
 */
export const Documentary: React.FC<DocumentaryProps> = ({
  title,
  mapboxToken,
  scenes,
}) => {
  const intro = Math.round(FPS * 2.5);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Title card */}
      <Sequence durationInFrames={intro}>
        <AbsoluteFill style={{ backgroundColor: "#070a12" }}>
          <TitleOverlay title={title} subtitle="A DocuForge AI documentary" />
        </AbsoluteFill>
      </Sequence>

      {/* Scenes */}
      <Sequence from={intro}>
        <Series>
          {scenes.map((scene) => {
            const duration = sceneDurationInFrames(scene);
            return (
              <Series.Sequence
                key={scene.sceneNumber}
                durationInFrames={duration}
                offset={scene.sceneNumber === 1 ? 0 : -TRANSITION_FRAMES}
              >
                <SceneRenderer
                  scene={scene}
                  mapboxToken={mapboxToken}
                  durationInFrames={duration}
                />
              </Series.Sequence>
            );
          })}
        </Series>
      </Sequence>
    </AbsoluteFill>
  );
};
