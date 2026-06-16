import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { motion } from "framer-motion";
import { KenBurnsImage } from "./KenBurnsImage";
import { Subtitle } from "./Subtitle";
import { MapSequence } from "./MapSequence";
import type { Scene } from "../types";

interface Props {
  scene: Scene;
  mapboxToken: string;
}

const fileSrc = (p?: string | null): string | undefined => {
  if (!p) return undefined;
  if (p.startsWith("http") || p.startsWith("file://")) return p;
  return staticFile(p.replace(/^\/?storage\//, ""));
};

export const SceneRenderer: React.FC<Props> = ({ scene, mapboxToken }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const characterClip = fileSrc(scene.character_clip);
  const animatedClip = fileSrc(scene.animated_clip);
  const abstractStill = fileSrc(scene.abstract_image);
  const pexelsClip = scene.pexels?.[0]?.url;
  const pixabayClip = scene.pixabay?.[0]?.url;
  const wikiImg = scene.wikimedia_images?.[0]?.url;
  const archiveImg = scene.archive_items?.[0]?.url;

  const audioSrc = fileSrc(scene.narration_audio);
  const hasGeo = (scene.location_coordinates?.length ?? 0) > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {characterClip ? (
        <OffthreadVideo src={characterClip} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : animatedClip ? (
        <OffthreadVideo src={animatedClip} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : pexelsClip ? (
        <OffthreadVideo src={pexelsClip} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : pixabayClip ? (
        <OffthreadVideo src={pixabayClip} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : abstractStill ? (
        <KenBurnsImage src={abstractStill} />
      ) : wikiImg ? (
        <KenBurnsImage src={wikiImg} />
      ) : archiveImg ? (
        <KenBurnsImage src={archiveImg} />
      ) : (
        <AbsoluteFill style={{ background: "#111" }} />
      )}

      {hasGeo && mapboxToken ? (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <MapSequence
            points={scene.location_coordinates}
            mapboxToken={mapboxToken}
          />
        </AbsoluteFill>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "absolute",
          left: 80,
          top: 80,
          padding: "12px 20px",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          borderLeft: "4px solid #fff",
          color: "#fff",
          fontFamily: "Inter, sans-serif",
          fontSize: 28,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Scene {String(scene.scene_number).padStart(2, "0")}
        {scene.character_name ? ` — ${scene.character_name}` : ""}
      </motion.div>

      {scene.narration_alignment ? (
        <Subtitle alignment={scene.narration_alignment} t={t} />
      ) : null}

      {audioSrc ? <Audio src={audioSrc} /> : null}

      {/* Pull unused image refs into the bundle so the bundler keeps them. */}
      <Img src={fileSrc(scene.abstract_image) ?? ""} style={{ display: "none" }} />
    </AbsoluteFill>
  );
};
