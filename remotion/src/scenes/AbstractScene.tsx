import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Img } from "remotion";
import { motion } from "framer-motion";
import { SceneProps } from "../types";

export const AbstractScene: React.FC<{ scene: SceneProps }> = ({ scene }) => {
  const clip = scene.animated_clip_url;
  const still = scene.abstract_image_url;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <motion.div
        initial={{ filter: "blur(20px)", opacity: 0 }}
        animate={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "100%", height: "100%" }}
      >
        {clip ? (
          <OffthreadVideo
            src={clip}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : still ? (
          <Img
            src={still}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </motion.div>

      {/* Soft vignette to anchor the eye */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {scene.narration_audio_url && <Audio src={scene.narration_audio_url} />}
    </AbsoluteFill>
  );
};
