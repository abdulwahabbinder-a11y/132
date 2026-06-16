import { Composition } from "remotion";
import { DocumentaryComposition } from "./DocumentaryComposition";
import { ViralShortComposition } from "./ViralShortComposition";
import { defaultProps } from "./types";
import { defaultViralProps } from "./viralTypes";

const FPS = 24;
const SCENE_DURATION = 6;

export const RemotionRoot: React.FC = () => {
  const docDuration = defaultProps.scenes.length * SCENE_DURATION * FPS;
  const viralDuration = defaultViralProps.scenes.reduce(
    (acc, s) => acc + Math.round(s.duration_seconds * FPS),
    0
  );

  return (
    <>
      <Composition
        id="DocumentaryComposition"
        component={DocumentaryComposition}
        durationInFrames={Math.max(docDuration, FPS * 10)}
        fps={FPS}
        width={2560}
        height={1080}
        defaultProps={defaultProps}
      />
      <Composition
        id="ViralShortComposition"
        component={ViralShortComposition}
        durationInFrames={Math.max(viralDuration, FPS * 10)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultViralProps}
      />
    </>
  );
};
