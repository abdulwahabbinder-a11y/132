import { Composition } from "remotion";
import { DocumentaryVideo } from "./compositions/DocumentaryVideo";
import type { DocumentaryVideoProps } from "./types";

export const RemotionRoot: React.FC = () => {
  const sampleProps: DocumentaryVideoProps = {
    title: "Sample Documentary",
    scenes: [
      {
        id: "scene-1",
        scene_number: 1,
        narration_text: "In the beginning, there was data — vast, unstructured, and full of possibility.",
        visual_keywords: ["data", "network", "abstract"],
        is_abstract_scene: true,
        is_historical_character: false,
        character_name: null,
        location_coordinates: null,
        image_url: null,
        video_clip_url: null,
        final_clip_url: null,
        start_time_ms: 0,
        end_time_ms: 4000,
      },
    ],
    word_timestamps: [],
    aspect_ratio: "21:9",
    fps: 24,
    duration_in_frames: 720, // 30 seconds at 24fps
  };

  return (
    <>
      <Composition
        id="DocumentaryVideo"
        component={DocumentaryVideo}
        durationInFrames={sampleProps.duration_in_frames}
        fps={sampleProps.fps}
        width={2560}   // 21:9 width
        height={1080}  // 21:9 height
        defaultProps={sampleProps}
      />
    </>
  );
};
