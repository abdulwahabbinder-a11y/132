import { motion } from "motion/react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { CaptionOverlay } from "./CaptionOverlay";
import { MapSequence } from "./MapSequence";
import type { DocumentaryManifest } from "./types";

const fallbackGradient =
  "linear-gradient(135deg, rgba(12,18,32,1) 0%, rgba(7,15,27,1) 50%, rgba(2,6,23,1) 100%)";

function SceneCard({
  scene,
  musicPath,
}: {
  scene: DocumentaryManifest["scenes"][number];
  musicPath?: string;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames], [0, 1]);
  const scale = interpolate(frame, [0, durationInFrames], [1.02, 1.12]);

  return (
    <AbsoluteFill style={{ background: fallbackGradient }}>
      {scene.clipPath ? (
        scene.clipPath.endsWith(".mp4") || scene.clipPath.endsWith(".webm") ? (
          <Video
            src={scene.clipPath}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
          />
        ) : (
          <Img
            src={scene.clipPath}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
          />
        )
      ) : (
        <AbsoluteFill
          style={{
            background: fallbackGradient,
            justifyContent: "center",
            alignItems: "center",
            fontSize: 52,
            fontWeight: 700,
          }}
        >
          Documentary scene render pending...
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(3,7,18,0.2) 0%, rgba(3,7,18,0.35) 45%, rgba(3,7,18,0.82) 100%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          position: "absolute",
          top: 68,
          left: 72,
          maxWidth: 980,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            padding: "12px 18px",
            background: "rgba(12,18,32,0.72)",
            color: "#67e8f9",
            fontSize: 18,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Scene {scene.sceneNumber}
        </div>
        <h2 style={{ fontSize: 56, lineHeight: 1.06, margin: 0, fontWeight: 700 }}>
          {scene.narrationText}
        </h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          {scene.visualKeywords.map((keyword) => (
            <span
              key={keyword}
              style={{
                borderRadius: 999,
                padding: "10px 16px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 20,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </motion.div>

      {scene.mapCoordinates ? (
        <MapSequence coordinates={scene.mapCoordinates} frameProgress={progress} />
      ) : null}
      <CaptionOverlay words={scene.subtitles} />
      {musicPath ? <Audio src={musicPath} volume={0.15} /> : null}
    </AbsoluteFill>
  );
}

export function DocumentaryComposition({ manifest, musicPath }: { manifest: DocumentaryManifest; musicPath?: string }) {
  const { fps } = useVideoConfig();
  const framesPerScene = fps * 4;

  return (
    <AbsoluteFill>
      {manifest.scenes.map((scene, index) => (
        <Sequence
          key={scene.sceneNumber}
          from={index * framesPerScene}
          durationInFrames={framesPerScene}
        >
          <SceneCard scene={scene} musicPath={musicPath} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
