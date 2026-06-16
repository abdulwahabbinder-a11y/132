import type { StoryScene } from "@/lib/types";

export function SceneTimeline({ scenes }: { scenes: StoryScene[] }) {
  if (!scenes.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 p-8 text-sm text-slate-400">
        Generated scenes will appear here before the video pipeline begins rendering.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scenes.map((scene) => (
        <article key={scene.scene_number} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
            <span>Scene {scene.scene_number}</span>
            {scene.is_abstract_scene ? <span className="rounded-full bg-brass/20 px-2 py-1 text-brass">Flux abstract</span> : null}
            {scene.is_historical_character ? (
              <span className="rounded-full bg-signal/20 px-2 py-1 text-signal">Character cinematic</span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-200">{scene.narration_text}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {scene.visual_keywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-black/30 px-3 py-1 text-xs text-slate-300">
                {keyword}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
