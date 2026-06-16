# Architecture

The platform is split into three deployable surfaces:

1. `apps/web`: Next.js SaaS frontend with dashboard, pricing cards, authenticated generation form, and job status views.
2. `apps/api`: FastAPI backend that verifies Supabase JWTs, checks subscription credits, routes story generation to NVIDIA NIM models, launches media scraping/generation, and calls the Remotion renderer.
3. `packages/remotion`: Remotion composition and Node render entrypoint for cinematic 21:9 documentary assembly.

## Pipeline

```text
Topic + language
  -> /api/generate-story
  -> credits check in Supabase
  -> Llama 3.1 or Qwen 2.5 strict chronological JSON
  -> background asset worker
      -> Wikipedia/Wikidata facts
      -> Wikimedia/Internet Archive archival media
      -> Pexels/Pixabay b-roll
      -> Flux abstract images
      -> ElevenLabs narration + timestamps
      -> Wan2.1 cinematic image animation
      -> LivePortrait + DeepVideo-V1 character pass
  -> Remotion render payload
  -> FFmpeg ducking, transition SFX, subtitle burn-in
  -> MP4 render URL
```

## Database tables

The Supabase migration in `apps/api/supabase/schema.sql` defines `users`, `subscriptions`, and `video_jobs`.

`subscriptions.video_credits_left` is decremented for each accepted generation request and reset to `30` on Stripe subscription creation webhooks.
