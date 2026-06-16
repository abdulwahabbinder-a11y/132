import React from "react";
import { Composition } from "remotion";
import { DocumentaryComposition } from "./DocumentaryComposition";

export const Root: React.FC = () => {
  return (
    <Composition
      id="DocumentaryComposition"
      component={DocumentaryComposition}
      width={2520}
      height={1080}
      fps={30}
      durationInFrames={30 * 240}
      defaultProps={{ scenes: [] }}
    />
  );
};
