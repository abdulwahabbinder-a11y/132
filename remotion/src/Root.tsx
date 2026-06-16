import React from "react";
import { Composition } from "remotion";
import { Documentary } from "./Documentary";
import { FPS, HEIGHT, WIDTH } from "./constants";
import { sampleProps } from "./sampleProps";
import { totalDurationInFrames } from "./utils/timing";
import type { DocumentaryProps } from "./types";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Documentary"
      component={Documentary}
      durationInFrames={totalDurationInFrames(sampleProps.scenes) + FPS * 3}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={sampleProps}
      calculateMetadata={({ props }: { props: DocumentaryProps }) => {
        // Duration is data-driven: title card (~2.5s) + sum of scene durations.
        return {
          durationInFrames:
            totalDurationInFrames(props.scenes) + Math.round(FPS * 2.5),
        };
      }}
    />
  );
};
