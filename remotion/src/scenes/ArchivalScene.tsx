import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Img, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { motion } from "framer-motion";
import { MapWaypoint, SceneProps } from "../types";

type Props = {
  scene: SceneProps;
  mapPath?: MapWaypoint[];
  mapboxToken?: string;
};

/**
 * Archival B-roll scene — plays the first stock video or stacks images with
 * a slow Ken-Burns pan. Audio narration is muxed via <Audio>.
 */
export const ArchivalScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const zoom = interpolate(t, [0, 10], [1.0, 1.08], { extrapolateRight: "clamp" });

  const video = scene.background_video_urls[0];
  const image = scene.image_urls[0];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <motion.div
        initial={{ scale: 1.02, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ width: "100%", height: "100%", transform: `scale(${zoom})` }}
      >
        {video ? (
          <OffthreadVideo
            src={video}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : image ? (
          <Img
            src={image}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <AbsoluteFill style={{ background: "#111" }} />
        )}
      </motion.div>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {scene.narration_audio_url && <Audio src={scene.narration_audio_url} />}
    </AbsoluteFill>
  );
};
