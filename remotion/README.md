# DocuForge AI — Remotion Video Project

The core video orchestration framework. Renders the `DocumentaryVideo`
composition to a 21:9 cinematic MP4 from props produced by the backend timeline
builder (`backend/app/services/assembly/timeline.py`).

## How it fits

```
backend pipeline  ──writes──►  jobs/<id>/props.json
                  ──invokes──►  npx remotion render src/index.ts DocumentaryVideo out.mp4 --props=props.json
```

The backend then runs FFmpeg post-processing (audio ducking, transition SFX,
subtitle burn-in, final 21:9 master).

## Composition props

See `src/types.ts` (`DocumentaryProps`). Each scene carries:

- `primary_visual` — Wan2.1/LivePortrait/DeepVideo clip, archival/Flux still
  (Ken-Burns), or B-roll video
- `captions` — ElevenLabs word timestamps for synced subtitles
- `location_coordinates` — drives the animated Mapbox `MapSequence`
- `motion` — Motion.dev (Framer Motion) spring config for transitions/titles
- `audio_src` — per-scene narration track

## Components

| File | Role |
|------|------|
| `Root.tsx` | registers composition + `calculateMetadata` (21:9 size from props) |
| `DocumentaryVideo.tsx` | sequences scenes on the global timeline |
| `components/Scene.tsx` | per-scene visual + map + title + subtitles + audio |
| `components/SceneVisual.tsx` | video vs Ken-Burns vs solid selection |
| `components/KenBurns.tsx` | procedural pan/zoom on stills |
| `components/Subtitles.tsx` | centre-bottom word-synced captions |
| `components/MapSequence.tsx` | animated Mapbox geopolitical overlay |
| `components/TitleOverlay.tsx` | typographic character/chapter titles |

## Develop

```bash
npm install
npm run dev      # Remotion Studio with sample defaultProps

# Render with backend props:
npx remotion render src/index.ts DocumentaryVideo out/video.mp4 --props=/path/to/props.json
```

Place any bundled local assets under a `public/` folder; remote assets are served
from the backend `/static` mount and referenced by absolute URL.
