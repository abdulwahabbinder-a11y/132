import { z } from "zod";

export const GeoPoint = z.object({
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  label: z.string().optional().nullable(),
});

export const StockClip = z.object({
  source: z.string(),
  url: z.string().url(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  duration: z.number().optional().nullable(),
});

export const ImageAsset = z.object({
  source: z.string(),
  url: z.string().url(),
  title: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
});

export const SceneSchema = z.object({
  scene_number: z.number().int().positive(),
  narration_text: z.string(),
  is_abstract_scene: z.boolean().default(false),
  is_historical_character: z.boolean().default(false),
  character_name: z.string().nullable().optional(),
  location_coordinates: z.array(GeoPoint).default([]),
  narration_audio: z.string().optional().nullable(),
  narration_alignment: z
    .object({
      characters: z.array(z.string()).default([]),
      character_start_times_seconds: z.array(z.number()).default([]),
      character_end_times_seconds: z.array(z.number()).default([]),
    })
    .nullable()
    .optional(),
  abstract_image: z.string().nullable().optional(),
  animated_clip: z.string().nullable().optional(),
  character_clip: z.string().nullable().optional(),
  wikimedia_images: z.array(ImageAsset).nullable().optional(),
  archive_items: z.array(ImageAsset).nullable().optional(),
  pexels: z.array(StockClip).nullable().optional(),
  pixabay: z.array(StockClip).nullable().optional(),
});

export const DocumentaryPropsSchema = z.object({
  job_id: z.string(),
  topic: z.string(),
  language: z.string().default("en"),
  model: z.string().default("meta/llama-3.1-70b-instruct"),
  aspect_ratio: z.string().default("21:9"),
  fps: z.number().default(30),
  mapbox_token: z.string().optional().default(""),
  scenes: z.array(SceneSchema),
});

export type DocumentaryProps = z.infer<typeof DocumentaryPropsSchema>;
export type Scene = z.infer<typeof SceneSchema>;
