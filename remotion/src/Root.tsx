import { Composition } from "remotion";
import { DocumentaryComposition } from "./DocumentaryComposition";
import { defaultProps } from "./types";

const FPS = 24;
const SCENE_DURATION = 6;

export const RemotionRoot: React.FC = () => {
  const durationInFrames = defaultProps.scenes.length * SCENE_DURATION * FPS;

  return (
    <>
      <Composition
        id="DocumentaryComposition"
        component={DocumentaryComposition}
        durationInFrames={Math.max(durationInFrames, FPS * 10)}
        fps={FPS}
        width={2560}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};
