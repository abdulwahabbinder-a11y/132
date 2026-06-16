# Video Engine (Remotion + Motion.dev)

This package renders 21:9 cinematic documentary output:

- Remotion orchestrates scene sequencing.
- Motion.dev (`framer-motion`) powers transition overlays.
- Mapbox static maps are rendered using `location_coordinates`.
- Subtitles are placed center-bottom based on narration scene text.

Render entrypoint:

```bash
node src/render.js --input ./tmp-input.json --output ./out.mp4
```
