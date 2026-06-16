import {
  AbsoluteFill,
  OffthreadVideo,
  Img,
  useCurrentFrame,
  interpolate,
  Easing,
  spring,
  useVideoConfig,
} from "remotion";
import { SceneData } from "../types";
import { GeopoliticalMap } from "./GeopoliticalMap";

interface Props {
  scene: SceneData;
  fps: number;
}

export const SceneComposition: React.FC<Props> = ({ scene, fps }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Cinematic Ken Burns zoom effect on images
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    easing: Easing.out(Easing.quad),
  });

  const opacity = spring({ frame, fps, config: { damping: 50, stiffness: 60 } });

  // Render the appropriate media layer
  const renderMedia = () => {
    // Priority: final_clip > video_clip > image > map > gradient
    if (scene.final_clip_url || scene.video_clip_url) {
      const src = scene.final_clip_url || scene.video_clip_url!;
      return (
        <OffthreadVideo
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }

    if (scene.image_url) {
      return (
        <Img
          src={scene.image_url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        />
      );
    }

    if (scene.location_coordinates) {
      return <GeopoliticalMap coordinates={scene.location_coordinates} frame={frame} fps={fps} />;
    }

    // Fallback gradient background
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, 
            hsl(${(scene.scene_number * 47) % 360}, 40%, 10%) 0%, 
            hsl(${(scene.scene_number * 47 + 120) % 360}, 30%, 5%) 100%)`,
        }}
      />
    );
  };

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Media layer */}
      <AbsoluteFill>{renderMedia()}</AbsoluteFill>

      {/* Cinematic vignette overlay */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Scene number indicator */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          color: "rgba(255,255,255,0.4)",
          fontSize: 14,
          fontFamily: "monospace",
          letterSpacing: 2,
          opacity: interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0]),
        }}
      >
        {String(scene.scene_number).padStart(2, "0")} / SCENE
      </div>

      {/* Location label */}
      {scene.location_coordinates && (
        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 60,
            color: "rgba(255,255,255,0.6)",
            fontSize: 16,
            fontFamily: "sans-serif",
            letterSpacing: 1,
            opacity: interpolate(frame, [0, 15, durationInFrames - 10, durationInFrames], [0, 1, 1, 0]),
          }}
        >
          📍 {scene.location_coordinates.label}
        </div>
      )}
    </AbsoluteFill>
  );
};
