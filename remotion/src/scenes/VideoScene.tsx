import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";

/**
 * Plays a generated/stock clip full-bleed. Used for Wan2.1-animated stills,
 * DeepVideo-V1 character cinematics, and Pexels/Pixabay B-roll.
 */
export const VideoScene: React.FC<{ src: string }> = ({ src }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={src}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};
