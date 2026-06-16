import React from "react";
import { Sequence, AbsoluteFill, Audio, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { motion } from "framer-motion";

type Scene = {
  scene_number: number;
  narration_text: string;
  location_coordinates: string;
  animated_clip?: { clip_url?: string };
  media?: Record<string, unknown>;
  word_timestamps?: {
    characters?: string[];
    character_start_times_seconds?: number[];
    character_end_times_seconds?: number[];
  };
};

type Props = {
  scenes: Scene[];
};

const sceneDurationFrames = 120;

const subtitleStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 40,
  left: "50%",
  transform: "translateX(-50%)",
  maxWidth: "75%",
  textAlign: "center",
  fontFamily: "Inter, sans-serif",
  fontSize: 42,
  padding: "12px 20px",
  borderRadius: 12,
  color: "#F8FAFC",
  backgroundColor: "rgba(2,6,23,0.72)"
};

function mapImageUrl(coords: string): string {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN ?? "";
  const [lat, lng] = coords.split(",");
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},4/1000x500?access_token=${mapboxToken}`;
}

function resolveSceneVisual(scene: Scene): string | undefined {
  if (scene.animated_clip?.clip_url) return scene.animated_clip.clip_url;
  const media = scene.media as { abstract_art?: { data?: Array<{ url?: string }> } } | undefined;
  return media?.abstract_art?.data?.[0]?.url;
}

export const DocumentaryComposition: React.FC<Props> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {scenes.map((scene, index) => {
        const from = index * sceneDurationFrames;
        const visualUrl = resolveSceneVisual(scene);
        return (
          <Sequence key={scene.scene_number} from={from} durationInFrames={sceneDurationFrames}>
            <AbsoluteFill>
              {visualUrl ? (
                <Img
                  src={visualUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.94 }}
                />
              ) : (
                <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: "white" }}>
                  Missing scene media
                </AbsoluteFill>
              )}

              {/* Motion.dev animation layer inside Remotion for smooth procedural transitions. */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  position: "absolute",
                  top: 32,
                  left: 32,
                  padding: 14,
                  borderRadius: 10,
                  background: "rgba(15,23,42,0.7)"
                }}
              >
                <p style={{ color: "#C4B5FD", margin: 0, fontSize: 18 }}>Scene {scene.scene_number}</p>
              </motion.div>

              <Img
                src={mapImageUrl(scene.location_coordinates)}
                style={{
                  position: "absolute",
                  right: 32,
                  bottom: 32,
                  width: 420,
                  height: 220,
                  borderRadius: 12,
                  opacity: interpolate(frame - from, [0, 15], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp"
                  })
                }}
              />

              <div style={subtitleStyle}>{scene.narration_text}</div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {/* Background music track is added in FFmpeg stage; per-scene voice tracks can be layered here if URLs exist. */}
      {scenes[0]?.animated_clip?.clip_url ? <Audio src={scenes[0].animated_clip.clip_url} /> : null}
      <div style={{ display: "none" }}>fps: {fps}</div>
    </AbsoluteFill>
  );
};
