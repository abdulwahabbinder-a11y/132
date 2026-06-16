import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

interface Props {
  fps: number;
  sceneDuration: number;
}

const TRANSITION_FRAMES = 12; // 0.5 seconds

export const TransitionOverlay: React.FC<Props> = ({ fps, sceneDuration }) => {
  const frame = useCurrentFrame();
  const transitionStart = sceneDuration - TRANSITION_FRAMES;

  // Fade to black at the end of each scene
  const opacity = interpolate(
    frame,
    [transitionStart, sceneDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.ease,
    }
  );

  if (frame < transitionStart) return null;

  return (
    <AbsoluteFill
      style={{
        background: "black",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
