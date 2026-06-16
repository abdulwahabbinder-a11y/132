import { motion } from "motion/react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface DocumentaryScene {
  scene_number: number;
  narration_text: string;
  visual_keywords: string[];
  is_abstract_scene: boolean;
  is_historical_character: boolean;
  character_name: string | null;
  location_coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  stockMedia?: Array<Record<string, unknown>>;
  archivalMedia?: Array<Record<string, unknown>>;
  generatedMedia?: Record<string, unknown> | null;
}

export interface DocumentaryCompositionProps {
  projectId: string;
  aspectRatio: "21:9";
  scenes: DocumentaryScene[];
  subtitleTracks: Array<{
    sceneNumber: number;
    timestamps: {
      characters?: string[];
      character_start_times_seconds?: number[];
      character_end_times_seconds?: number[];
    };
  }>;
  audioDucking: {
    backgroundMusicGain: number;
    voiceGain: number;
  };
  transitionSfx: string[];
}

function getMapUrl(scene: DocumentaryScene) {
  const coords = scene.location_coordinates;
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const style = process.env.NEXT_PUBLIC_MAPBOX_STYLE || "mapbox/dark-v11";

  if (!coords || !accessToken) {
    return null;
  }

  return `https://api.mapbox.com/styles/v1/${style}/static/pin-s+38bdf8(${coords.longitude},${coords.latitude})/${coords.longitude},${coords.latitude},4.2,0/1600x720?access_token=${accessToken}`;
}

function getVisibleSubtitle(
  timestamps: DocumentaryCompositionProps["subtitleTracks"][number]["timestamps"] | undefined,
  frame: number,
  fps: number,
  fallback: string,
) {
  if (!timestamps?.characters || !timestamps.character_end_times_seconds) {
    return fallback;
  }

  const seconds = frame / fps;
  const visibleCharacters = timestamps.characters.filter((_, index) => {
    return (timestamps.character_end_times_seconds?.[index] || 0) <= seconds + 0.2;
  });
  return visibleCharacters.join("").trim() || fallback;
}

function SceneMap({ scene }: { scene: DocumentaryScene }) {
  const mapUrl = getMapUrl(scene);

  if (!scene.location_coordinates) {
    return null;
  }

  return (
    <div className="absolute right-8 top-8 overflow-hidden rounded-3xl border border-white/15 bg-slate-950/70 shadow-2xl">
      {mapUrl ? (
        <Img src={mapUrl} alt="Location map" className="h-[220px] w-[420px] object-cover opacity-85" />
      ) : (
        <div className="flex h-[220px] w-[420px] items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.22),_transparent_45%),_linear-gradient(135deg,_#0f172a,_#020617)] text-center text-2xl font-medium text-slate-200">
          {scene.location_coordinates.latitude.toFixed(2)}, {scene.location_coordinates.longitude.toFixed(2)}
        </div>
      )}
      <div className="border-t border-white/10 px-5 py-3 text-sm text-slate-200">
        Geopolitical map cue for scene {scene.scene_number}
      </div>
    </div>
  );
}

export function DocumentaryComposition(props: DocumentaryCompositionProps) {
  const { durationInFrames } = useVideoConfig();
  const sceneDuration = Math.floor(durationInFrames / Math.max(props.scenes.length, 1));

  return (
    <AbsoluteFill className="bg-[#020617]">
      {props.scenes.map((scene, index) => {
        const sceneStart = index * sceneDuration;
        const subtitleTrack = props.subtitleTracks.find((item) => item.sceneNumber === scene.scene_number);

        return (
          <Sequence key={scene.scene_number} from={sceneStart} durationInFrames={sceneDuration}>
            <SceneCard scene={scene} subtitleTrack={subtitleTrack} />
          </Sequence>
        );
      })}

      <div className="absolute left-10 top-8 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-200">
        Project {props.projectId}
      </div>
      <div className="absolute right-10 top-8 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-200">
        21:9 cinematic render
      </div>
      <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_35%)]" />
      <div className="absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-black via-black/65 to-transparent" />
    </AbsoluteFill>
  );
}

function SceneCard({
  scene,
  subtitleTrack,
}: {
  scene: DocumentaryScene;
  subtitleTrack: DocumentaryCompositionProps["subtitleTracks"][number] | undefined;
}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fade = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });
  const scale = interpolate(fade, [0, 1], [1.08, 1]);
  const subtitle = getVisibleSubtitle(subtitleTrack?.timestamps, frame, fps, scene.narration_text);
  const keywordLabel = scene.visual_keywords.slice(0, 3).join(" • ");
  const backgroundOpacity = interpolate(frame, [0, durationInFrames], [0.55, 0.9]);

  return (
    <AbsoluteFill>
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${scale})`,
          opacity: backgroundOpacity,
          background:
            scene.is_abstract_scene
              ? "linear-gradient(135deg, rgba(30,41,59,1) 0%, rgba(2,6,23,1) 35%, rgba(15,23,42,1) 100%)"
              : "linear-gradient(135deg, rgba(8,47,73,1) 0%, rgba(2,6,23,1) 35%, rgba(12,74,110,1) 100%)",
        }}
      />

      <SceneMap scene={scene} />

      <div className="absolute left-16 top-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm uppercase tracking-[0.3em] text-sky-200">
            Scene {scene.scene_number}
            {scene.is_historical_character && scene.character_name ? ` • ${scene.character_name}` : ""}
          </div>
          <h2 className="max-w-4xl text-7xl font-semibold leading-[1.05] tracking-tight text-white">
            {scene.narration_text}
          </h2>
          <p className="text-xl text-slate-300">{keywordLabel}</p>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 w-[72%] -translate-x-1/2 rounded-3xl border border-white/10 bg-black/55 px-8 py-5 text-center text-3xl font-medium leading-tight text-white shadow-2xl">
        {subtitle}
      </div>
    </AbsoluteFill>
  );
}
