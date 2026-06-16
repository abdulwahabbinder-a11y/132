import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo } from "remotion";
import { motion } from "framer-motion";
import { SceneProps } from "../types";

/**
 * Renders the DeepVideo-V1-enhanced LivePortrait character clip with a clean
 * lower-third overlay carrying the character name.
 */
export const CharacterScene: React.FC<{ scene: SceneProps }> = ({ scene }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scene.character_clip_url && (
        <OffthreadVideo
          src={scene.character_clip_url}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      {scene.character_name && (
        <motion.div
          initial={{ x: -240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          style={{
            position: "absolute",
            left: 80,
            bottom: 220,
            padding: "16px 28px",
            background: "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0))",
            borderLeft: "4px solid #ffffff",
          }}
        >
          <div style={{ color: "#fff", fontFamily: "Inter", fontSize: 40, fontWeight: 700 }}>
            {scene.character_name}
          </div>
        </motion.div>
      )}

      {scene.narration_audio_url && <Audio src={scene.narration_audio_url} />}
    </AbsoluteFill>
  );
};
