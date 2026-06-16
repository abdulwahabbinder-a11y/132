import React from "react";
import { Composition } from "remotion";
import { DocumentaryComposition, FPS, CINEMATIC_WIDTH, CINEMATIC_HEIGHT } from "./DocumentaryComposition";
import { DocumentaryProps } from "./types";

const defaultProps: DocumentaryProps = {
  title: "Untitled Documentary",
  scenes: [],
  map_path: [],
  mapbox_token: "",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DocumentaryComposition"
        component={DocumentaryComposition}
        durationInFrames={FPS * 30}
        fps={FPS}
        width={CINEMATIC_WIDTH}
        height={CINEMATIC_HEIGHT}
        defaultProps={defaultProps}
        calculateMetadata={async ({ props }) => {
          // Estimate duration from the longest scene timestamp.
          const totalSeconds = props.scenes.reduce((acc, s) => {
            const last = s.word_timestamps.at(-1)?.end_s ?? 8;
            return acc + Math.max(4, last + 0.5);
          }, 0);
          return {
            durationInFrames: Math.max(FPS * 10, Math.ceil(totalSeconds * FPS)),
          };
        }}
      />
    </>
  );
};
