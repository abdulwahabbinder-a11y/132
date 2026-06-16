import React from "react";
import { AbsoluteFill, Audio } from "remotion";
import type { RemotionScene } from "../types";
import { ImageScene } from "./ImageScene";
import { VideoScene } from "./VideoScene";
import { MapScene } from "./MapScene";
import { Subtitles } from "../components/Subtitles";

/**
 * Decides the best visual representation for a scene:
 *   1. A synthesized character/motion clip (DeepVideo-V1 / Wan2.1), if present.
 *   2. An animated map, when the scene is geolocated.
 *   3. The first available stock video clip.
 *   4. A Ken-Burns archival/AI image.
 * Narration audio + burned-in subtitles are layered on top of every scene.
 */
export const SceneRenderer: React.FC<{
  scene: RemotionScene;
  mapboxToken: string;
  durationInFrames: number;
}> = ({ scene, mapboxToken, durationInFrames }) => {
  return (
    <AbsoluteFill>
      <Visual scene={scene} mapboxToken={mapboxToken} durationInFrames={durationInFrames} />

      {scene.audioUrl && <Audio src={scene.audioUrl} />}

      <Subtitles words={scene.wordTimestamps} narration={scene.narration} />
    </AbsoluteFill>
  );
};

const Visual: React.FC<{
  scene: RemotionScene;
  mapboxToken: string;
  durationInFrames: number;
}> = ({ scene, mapboxToken, durationInFrames }) => {
  if (scene.clipUrl) {
    return <VideoScene src={scene.clipUrl} />;
  }

  if (scene.locationCoordinates) {
    return (
      <MapScene
        coordinates={scene.locationCoordinates}
        mapboxToken={mapboxToken}
        label={scene.characterName ?? null}
        durationInFrames={durationInFrames}
      />
    );
  }

  const video = scene.mediaAssets.find((a) => a.type === "video");
  if (video) {
    return <VideoScene src={video.url} />;
  }

  const image = scene.mediaAssets.find((a) => a.type === "image");
  if (image) {
    return <ImageScene src={image.url} durationInFrames={durationInFrames} />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f1a" }} />
  );
};
