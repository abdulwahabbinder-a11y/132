import React from "react";
import { Composition } from "remotion";
import { DocumentaryVideo } from "./DocumentaryVideo";
import { defaultProps } from "./defaultProps";
import type { DocumentaryProps } from "./types";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DocumentaryVideo"
      component={DocumentaryVideo}
      // Defaults are overridden by --props=props.json at render time.
      durationInFrames={defaultProps.durationInFrames}
      fps={defaultProps.fps}
      width={defaultProps.width}
      height={defaultProps.height}
      defaultProps={defaultProps}
      calculateMetadata={({ props }: { props: DocumentaryProps }) => ({
        durationInFrames: props.durationInFrames,
        fps: props.fps,
        width: props.width,
        height: props.height,
      })}
    />
  );
};
