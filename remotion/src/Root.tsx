import React from "react";
import { Composition } from "remotion";
import { Documentary } from "./Documentary";
import { DocumentaryPropsSchema } from "./types";

const DEFAULT_FPS = 30;
const DEFAULT_DURATION_SECONDS = 60;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Documentary"
        component={Documentary}
        schema={DocumentaryPropsSchema}
        durationInFrames={DEFAULT_FPS * DEFAULT_DURATION_SECONDS}
        fps={DEFAULT_FPS}
        width={2560}
        height={1080}
        defaultProps={{
          job_id: "preview",
          topic: "The Silk Road",
          language: "en",
          model: "meta/llama-3.1-70b-instruct",
          aspect_ratio: "21:9",
          fps: DEFAULT_FPS,
          mapbox_token: "",
          scenes: [
            {
              scene_number: 1,
              narration_text: "In 130 BCE, Han China opened the world's most influential trade artery.",
              is_abstract_scene: false,
              is_historical_character: false,
              character_name: null,
              location_coordinates: [
                { lon: 108.93, lat: 34.34, label: "Chang'an" },
              ],
              narration_audio: null,
              narration_alignment: null,
              wikimedia_images: [],
              archive_items: [],
              pexels: [],
              pixabay: [],
            },
          ],
        }}
        calculateMetadata={({ props }) => {
          const totalSeconds = Math.max(
            6,
            props.scenes.reduce((acc, s) => {
              const align = s.narration_alignment;
              const end = align?.character_end_times_seconds?.slice(-1)?.[0] ?? 8;
              return acc + end + 0.3;
            }, 0)
          );
          return {
            durationInFrames: Math.round(totalSeconds * props.fps),
            fps: props.fps,
            width: 2560,
            height: 1080,
          };
        }}
      />
    </>
  );
};
