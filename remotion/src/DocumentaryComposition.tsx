import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { DocumentaryProps } from "./types";
import { ArchivalScene } from "./scenes/ArchivalScene";
import { AbstractScene } from "./scenes/AbstractScene";
import { CharacterScene } from "./scenes/CharacterScene";
import { MapScene } from "./scenes/MapScene";
import { Subtitle } from "./components/Subtitle";
import { AnimatedTitle } from "./components/AnimatedTitle";

// 21:9 cinematic master — 2520x1080 at 30 fps.
export const CINEMATIC_WIDTH = 2520;
export const CINEMATIC_HEIGHT = 1080;
export const FPS = 30;

export const DocumentaryComposition: React.FC<DocumentaryProps> = ({
  title,
  scenes,
  map_path,
  mapbox_token,
}) => {
  const { fps } = useVideoConfig();

  let cursor = 0;
  const sceneSequences = scenes.map((scene) => {
    const last = scene.word_timestamps.at(-1)?.end_s ?? 8;
    const sceneDurationSec = Math.max(4, last + 0.5);
    const sceneDurationFrames = Math.ceil(sceneDurationSec * fps);
    const from = cursor;
    cursor += sceneDurationFrames;

    return { scene, from, duration: sceneDurationFrames };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* 0–3s: animated title card */}
      <Sequence from={0} durationInFrames={fps * 3} layout="none">
        <AnimatedTitle title={title} />
      </Sequence>

      {sceneSequences.map(({ scene, from, duration }) => {
        const SceneComponent = pickScene(scene);
        return (
          <Sequence
            key={scene.scene_number}
            from={from}
            durationInFrames={duration}
            layout="none"
          >
            <SceneComponent scene={scene} mapPath={map_path} mapboxToken={mapbox_token} />
            <Subtitle words={scene.word_timestamps} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

function pickScene(scene: DocumentaryProps["scenes"][number]) {
  if (scene.is_historical_character && scene.character_clip_url) {
    return CharacterScene;
  }
  if (scene.is_abstract_scene) {
    return AbstractScene;
  }
  if (scene.location_coordinates) {
    return MapScene;
  }
  return ArchivalScene;
}
