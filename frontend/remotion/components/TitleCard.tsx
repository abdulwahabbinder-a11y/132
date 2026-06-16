import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";

interface Props {
  title: string;
  fps: number;
}

export const TitleCard: React.FC<Props> = ({ title, fps }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, config: { damping: 40, stiffness: 80 } });
  const titleY = interpolate(frame, [0, 20], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const lineOpacity = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 40 } });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, #1e1b4b 0%, #0f0f1a 60%, #000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 400,
          background: "radial-gradient(ellipse, rgba(100,112,241,0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* DocuAI logo mark */}
      <div
        style={{
          opacity: lineOpacity,
          fontSize: 18,
          letterSpacing: 8,
          color: "rgba(100,112,241,0.8)",
          fontFamily: "sans-serif",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        D O C U A I
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: Math.min(72, 2560 / title.length),
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          maxWidth: "80%",
          lineHeight: 1.2,
          textShadow: "0 0 60px rgba(100,112,241,0.4)",
        }}
      >
        {title}
      </div>

      {/* Separator line */}
      <div
        style={{
          opacity: lineOpacity,
          width: interpolate(frame, [12, 36], [0, 300], { extrapolateRight: "clamp" }),
          height: 2,
          background: "linear-gradient(90deg, transparent, #6470f1, transparent)",
        }}
      />
    </AbsoluteFill>
  );
};
