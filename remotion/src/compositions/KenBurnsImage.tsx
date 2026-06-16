import React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  src: string;
  durationFrames?: number;
}

export const KenBurnsImage: React.FC<Props> = ({ src, durationFrames }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const total = durationFrames ?? durationInFrames;
  const scale = interpolate(frame, [0, total], [1.05, 1.18], { extrapolateRight: "clamp" });
  const x = interpolate(frame, [0, total], [-15, 15], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, total], [-10, 10], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
          transition: "transform 0.05s linear",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
