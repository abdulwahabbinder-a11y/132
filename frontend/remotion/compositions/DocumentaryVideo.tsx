import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { DocumentaryVideoProps } from "../types";
import { SceneComposition } from "../components/SceneComposition";
import { SubtitleOverlay } from "../components/SubtitleOverlay";
import { TitleCard } from "../components/TitleCard";
import { TransitionOverlay } from "../components/TransitionOverlay";

export const DocumentaryVideo: React.FC<DocumentaryVideoProps> = ({
  title,
  scenes,
  word_timestamps,
  aspect_ratio,
  fps,
  background_music_url,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const TITLE_DURATION = fps * 3; // 3 second title card

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Title card — first 3 seconds */}
      <Sequence from={0} durationInFrames={TITLE_DURATION}>
        <TitleCard title={title} fps={fps} />
      </Sequence>

      {/* Scene sequences */}
      {scenes.map((scene, i) => {
        const sceneDuration = Math.round(((scene.end_time_ms - scene.start_time_ms) / 1000) * fps);
        const startFrame = TITLE_DURATION + scenes.slice(0, i).reduce((acc, s) => {
          return acc + Math.round(((s.end_time_ms - s.start_time_ms) / 1000) * fps);
        }, 0);

        return (
          <Sequence
            key={scene.id}
            from={startFrame}
            durationInFrames={Math.max(sceneDuration, fps * 4)} // Minimum 4 seconds
          >
            <SceneComposition scene={scene} fps={fps} />

            {/* Transition overlay at end of scene */}
            {i < scenes.length - 1 && (
              <TransitionOverlay fps={fps} sceneDuration={Math.max(sceneDuration, fps * 4)} />
            )}
          </Sequence>
        );
      })}

      {/* Word-level subtitle overlay — runs over entire video */}
      <SubtitleOverlay
        wordTimestamps={word_timestamps}
        fps={fps}
        titleDuration={TITLE_DURATION}
      />

      {/* Background music (ducked by FFmpeg in final render) */}
      {background_music_url && (
        <Audio
          src={background_music_url}
          volume={(f) =>
            interpolate(f, [0, 30], [0, 0.15], { extrapolateRight: "clamp" })
          }
        />
      )}

      {/* Fade in/out */}
      <AbsoluteFill
        style={{
          background: "black",
          opacity: interpolate(
            frame,
            [0, fps * 0.5, durationInFrames - fps * 0.5, durationInFrames],
            [1, 0, 0, 1],
            { easing: Easing.ease }
          ),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
