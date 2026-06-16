import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { MapSequence, SceneProps } from "../types";
import { resolveSrc } from "../lib/resolveSrc";
import { SceneVisual } from "./SceneVisual";
import { Subtitles } from "./Subtitles";
import { MapSequence as MapSequenceView } from "./MapSequence";
import { TitleOverlay } from "./TitleOverlay";

export const Scene: React.FC<{
  scene: SceneProps;
  map: MapSequence;
}> = ({ scene, map }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Crossfade in/out at scene boundaries.
  const fadeFrames = Math.min(12, Math.floor(durationInFrames / 4));
  const opacity = interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const audioSrc = resolveSrc(scene.audio_src);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneVisual
        visual={scene.primary_visual}
        durationInFrames={durationInFrames}
        sceneNumber={scene.scene_number}
      />

      {/* Cinematic vignette + bottom gradient for subtitle legibility */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 35%), radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {scene.location_coordinates && (
        <MapSequenceView map={map} location={scene.location_coordinates} />
      )}

      {scene.is_historical_character && scene.character_name && (
        <TitleOverlay text={scene.character_name} motion={scene.motion} />
      )}

      <Subtitles captions={scene.captions} />

      {audioSrc && <Audio src={audioSrc} />}
    </AbsoluteFill>
  );
};
