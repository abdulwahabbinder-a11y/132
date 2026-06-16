import { AbsoluteFill, Audio, Img, interpolate, spring, useCurrentFrame, useVideoConfig, Video } from "remotion";
import { MapSequence } from "./MapSequence";
import { motionPresets } from "./motionPresets";
import { Subtitles } from "./Subtitles";
import type { SceneRenderManifest } from "./types";

type Props = {
  sceneManifest: SceneRenderManifest;
  mapboxToken: string | null;
};

export function SceneComposition({ sceneManifest, mapboxToken }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { scene, voiceover } = sceneManifest;
  const mediaRef = selectMedia(sceneManifest);
  const entrance = spring({ frame, fps, config: motionPresets.editorialSpring });
  const scale = interpolate(frame, [0, 180], [1.08, 1.0], { extrapolateRight: "clamp" });
  const titleY = interpolate(entrance, [0, 1], [80, 0]);
  const titleOpacity = interpolate(entrance, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050712", overflow: "hidden" }}>
      {mediaRef?.kind === "video" ? (
        <Video
          src={mediaRef.src}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
        />
      ) : mediaRef?.src ? (
        <Img
          src={mediaRef.src}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }}
        />
      ) : (
        <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 20%, #1e293b, #020617 62%)" }} />
      )}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.35) 48%, rgba(2,6,23,0.74) 100%)"
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 86,
          bottom: 182,
          width: 1120,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontFamily: "Inter, Helvetica, Arial, sans-serif"
        }}
      >
        <div style={{ color: "#7dd3fc", fontSize: 24, letterSpacing: 9, textTransform: "uppercase" }}>
          Scene {scene.scene_number.toString().padStart(2, "0")}
        </div>
        <h2 style={{ margin: "18px 0 0", color: "white", fontSize: 78, lineHeight: 0.95, letterSpacing: -3 }}>
          {scene.visual_keywords.slice(0, 4).join(" / ")}
        </h2>
        {scene.is_historical_character && scene.character_name ? (
          <p style={{ marginTop: 22, color: "#d6a84f", fontSize: 34, fontWeight: 700 }}>{scene.character_name}</p>
        ) : null}
      </div>

      <MapSequence coordinates={scene.location_coordinates} token={mapboxToken} />
      {voiceover?.audio_path ? <Audio src={assetSrc(voiceover.audio_path)} /> : null}
      {voiceover ? <Subtitles words={voiceover.word_timestamps} /> : null}
    </AbsoluteFill>
  );
}

function selectMedia(sceneManifest: SceneRenderManifest): { kind: "image" | "video"; src: string } | null {
  if (sceneManifest.cinematic_clip_path) {
    return { kind: "video", src: assetSrc(sceneManifest.cinematic_clip_path) };
  }
  const stockVideo = sceneManifest.assets.find((asset) => asset.asset_type === "video" && (asset.local_path || asset.url));
  if (stockVideo) {
    return { kind: "video", src: assetSrc(stockVideo.local_path ?? stockVideo.url ?? "") };
  }
  const image = sceneManifest.assets.find((asset) => asset.asset_type === "image" && (asset.local_path || asset.url));
  if (image) {
    return { kind: "image", src: assetSrc(image.local_path ?? image.url ?? "") };
  }
  return null;
}

function assetSrc(value: string): string {
  if (!value) {
    return value;
  }
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("file://")) {
    return value;
  }
  if (value.startsWith("/")) {
    return `file://${value}`;
  }
  return value;
}
