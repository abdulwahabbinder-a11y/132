import { Composition } from "remotion";

import { DocumentaryComposition, DocumentaryCompositionProps } from "./scenes/documentary-composition";

const defaultProps: DocumentaryCompositionProps = {
  projectId: "demo",
  mapboxToken: "",
  scenes: [],
  subtitles: [],
  soundtrackPath: "",
  transitionSfxPath: "",
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DocumentaryComposition"
        component={DocumentaryComposition}
        durationInFrames={30 * 60}
        fps={30}
        width={2520}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};
