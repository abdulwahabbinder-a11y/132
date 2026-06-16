import { Composition, registerRoot } from "remotion";
import { Documentary, getDocumentaryDurationFrames, FPS, HEIGHT, WIDTH } from "./Documentary";
import { sampleManifest } from "./sampleManifest";
import type { DocumentaryRenderManifest } from "./types";

type CompositionProps = {
  manifest: DocumentaryRenderManifest;
};

function RemotionRoot() {
  return (
    <Composition
      id="Documentary"
      component={Documentary}
      width={WIDTH}
      height={HEIGHT}
      fps={FPS}
      durationInFrames={getDocumentaryDurationFrames(sampleManifest)}
      defaultProps={{ manifest: sampleManifest } satisfies CompositionProps}
      calculateMetadata={({ props }) => ({
        durationInFrames: getDocumentaryDurationFrames(props.manifest),
        props
      })}
    />
  );
}

registerRoot(RemotionRoot);
