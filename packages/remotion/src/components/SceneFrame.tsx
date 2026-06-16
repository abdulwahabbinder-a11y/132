import { motion, MotionConfig } from "motion/react";
import { Img, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import type { DocumentaryScene } from "../lib/types";
import { MapSequence } from "./MapSequence";
import { Subtitles } from "./Subtitles";

const transition = {
  type: "spring",
  stiffness: 90,
  damping: 18,
  mass: 0.8
} as const;

export function SceneFrame({
  scene,
  topic,
  mapboxToken
}: {
  scene: DocumentaryScene;
  topic: string;
  mapboxToken?: string;
}) {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 120], [1.04, 1.16], {
    extrapolateRight: "clamp"
  });
  const primaryVisual =
    scene.assets?.character_render?.final_character_clip ??
    scene.assets?.primary_visual_asset ??
    null;

  return (
    <MotionConfig transition={transition}>
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 20% 20%, rgba(255,106,61,0.35), transparent 32rem), #05060a",
          color: "white",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
        }}
      >
        {primaryVisual ? (
          isVideo(primaryVisual) ? (
            <OffthreadVideo
              src={primaryVisual}
              muted
              style={{
                position: "absolute",
                inset: 0,
                height: "100%",
                width: "100%",
                objectFit: "cover",
                opacity: 0.52,
                filter: "contrast(1.08) saturate(0.9)"
              }}
            />
          ) : (
            <Img
              src={primaryVisual}
              style={{
                position: "absolute",
                inset: 0,
                height: "100%",
                width: "100%",
                objectFit: "cover",
                transform: `scale(${zoom})`,
                opacity: 0.52,
                filter: "contrast(1.08) saturate(0.9)"
              }}
            />
          )
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(5,6,10,0.96) 0%, rgba(5,6,10,0.72) 42%, rgba(5,6,10,0.24) 100%)"
          }}
        />
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            position: "absolute",
            left: 96,
            top: 110,
            width: 1050
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#f4c15d",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "0.32em",
              textTransform: "uppercase"
            }}
          >
            Scene {scene.scene_number.toString().padStart(2, "0")}
          </p>
          <h1
            style={{
              margin: "28px 0 0",
              fontSize: 92,
              lineHeight: 0.92,
              letterSpacing: -5,
              fontWeight: 950
            }}
          >
            {topic}
          </h1>
          <p
            style={{
              margin: "36px 0 0",
              width: 900,
              color: "#cbd5e1",
              fontSize: 34,
              lineHeight: 1.24,
              fontWeight: 600
            }}
          >
            {scene.narration_text}
          </p>
        </motion.div>
        <MapSequence coordinates={scene.location_coordinates} mapboxToken={mapboxToken} />
        <Subtitles
          words={scene.assets?.narration?.timestamps}
          fallbackText={scene.narration_text}
        />
      </div>
    </MotionConfig>
  );
}

function isVideo(source: string) {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(source);
}
