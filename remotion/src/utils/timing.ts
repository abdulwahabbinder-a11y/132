import { DEFAULT_SCENE_SECONDS, FPS } from "../constants";
import type { RemotionScene } from "../types";

/** Duration of a scene in frames, derived from narration timestamps. */
export function sceneDurationInFrames(scene: RemotionScene): number {
  const last = scene.wordTimestamps[scene.wordTimestamps.length - 1];
  const seconds = last?.end ?? DEFAULT_SCENE_SECONDS;
  // Small tail so the last word doesn't cut off abruptly.
  return Math.max(Math.ceil((seconds + 0.6) * FPS), FPS);
}

/** Cumulative start frame for each scene. */
export function sceneStartFrames(scenes: RemotionScene[]): number[] {
  const starts: number[] = [];
  let acc = 0;
  for (const scene of scenes) {
    starts.push(acc);
    acc += sceneDurationInFrames(scene);
  }
  return starts;
}

export function totalDurationInFrames(scenes: RemotionScene[]): number {
  return scenes.reduce((sum, s) => sum + sceneDurationInFrames(s), 0) || FPS;
}
