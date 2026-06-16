import { motion } from "motion/react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { GeoPoliticalMap } from "../widgets/geo-political-map";

export type CompositionScene = {
  sceneNumber: number;
  mediaUrl: string;
  narrationTrack: string;
  title: string;
  locationCoordinates?: { lat: number; lng: number } | null;
};

export type SubtitleWord = {
  word: string;
  startMs: number;
  endMs: number;
};

export type DocumentaryCompositionProps = {
  projectId: string;
  mapboxToken: string;
  scenes: CompositionScene[];
  subtitles: SubtitleWord[];
  soundtrackPath: string;
  transitionSfxPath: string;
};

export const DocumentaryComposition = ({
  scenes,
  subtitles,
  soundtrackPath,
  transitionSfxPath,
  mapboxToken,
}: DocumentaryCompositionProps) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const activeSubtitle = subtitles.find((entry) => {
    const currentMs = (frame / fps) * 1000;
    return currentMs >= entry.startMs && currentMs <= entry.endMs;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617", color: "white" }}>
      <Audio src={soundtrackPath} volume={0.3} />
      {scenes.map((scene, index) => {
        const start = index * 4 * fps;
        const localFrame = Math.max(0, frame - start);
        const opacity = interpolate(localFrame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
        const scale = spring({ frame: localFrame, fps, config: { damping: 16 } });

        return (
          <Sequence key={scene.sceneNumber} from={start} durationInFrames={4 * fps}>
            <AbsoluteFill style={{ opacity }}>
              <motion.div
                style={{
                  width: "100%",
                  height: "100%",
                  scale,
                  position: "relative",
                }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Img src={scene.mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(2,6,23,0.1) 0%, rgba(2,6,23,0.35) 50%, rgba(2,6,23,0.7) 100%)",
                  }}
                />
                <div style={{ position: "absolute", left: 64, top: 56, maxWidth: width * 0.6, fontSize: 44, fontWeight: 700 }}>
                  {scene.title}
                </div>
                {scene.locationCoordinates ? (
                  <div style={{ position: "absolute", right: 36, top: 36, width: 540, height: 280, borderRadius: 20, overflow: "hidden" }}>
                    <GeoPoliticalMap
                      token={mapboxToken}
                      lat={scene.locationCoordinates.lat}
                      lng={scene.locationCoordinates.lng}
                    />
                  </div>
                ) : null}
              </motion.div>
              <Audio src={scene.narrationTrack} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <Audio src={transitionSfxPath} volume={0.2} />
      {activeSubtitle ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 52,
            textAlign: "center",
            fontSize: 40,
            fontWeight: 600,
            textShadow: "0 0 8px rgba(0,0,0,0.8)",
          }}
        >
          {activeSubtitle.word}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
