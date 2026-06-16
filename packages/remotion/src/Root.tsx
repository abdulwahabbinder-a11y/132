import { Composition, registerRoot } from "remotion";
import {
  DocumentaryComposition,
  getDurationInFrames
} from "./DocumentaryComposition";
import { defaultPayload } from "./lib/types";

function RemotionRoot() {
  return (
    <Composition
      id="DocumentaryFilm"
      component={DocumentaryComposition}
      durationInFrames={getDurationInFrames(defaultPayload.scenes)}
      fps={30}
      width={2560}
      height={1080}
      defaultProps={defaultPayload}
      calculateMetadata={({ props }) => ({
        durationInFrames: getDurationInFrames(props.scenes),
        fps: 30,
        width: 2560,
        height: 1080
      })}
    />
  );
}

registerRoot(RemotionRoot);
