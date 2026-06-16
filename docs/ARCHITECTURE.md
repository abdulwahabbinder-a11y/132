# DocuForge AI — Architecture

This document maps the SaaS specification onto the concrete modules in this repo.

## 1. Database, subscription & auth (Supabase + Stripe)

| Requirement                                   | Implementation                                                        |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Supabase PostgreSQL + models                  | `supabase/migrations/0001_init.sql` (`users`, `subscriptions`, …)    |
| `subscriptions` fields                        | `plan_type`, `stripe_customer_id`, `video_credits_left`, `billing_cycle_end` |
| `/api/webhooks/stripe`                        | `backend/app/api/routes/webhooks.py`                                 |
| `customer.subscription.created` → reset to 30 | `backend/app/services/billing/stripe_service.py:handle_subscription_created` |
| Pricing section ($0 / $29)                     | `frontend/src/components/PricingSection.tsx`                         |

Auth uses Supabase JWTs verified locally in `backend/app/core/security.py`.

## 2. SaaS engine & scripting router (Llama 3.1 / Qwen 2.5)

- Endpoint: `backend/app/api/routes/generate.py` → `POST /api/generate-story`
  (authenticated, returns `402` when `video_credits_left == 0`).
- Credit gate + atomic decrement: `backend/app/services/account.py` + the
  `decrement_video_credit` Postgres RPC.
- Model routing: `backend/app/services/scripting/router.py`
  - English → `meta/llama-3.1-70b-instruct`
  - Hindi / Urdu / Roman → `qwen/qwen-2.5-72b-instruct`
- Strict JSON scene schema (`scene_number`, `narration_text`, `visual_keywords`,
  `is_abstract_scene`, `is_historical_character`, `character_name`,
  `location_coordinates`) enforced in `backend/app/models/video.py:Scene` and the
  scripting prompt (`backend/app/services/scripting/prompts.py`).

## 3. Public data scraper & multi-source media fetcher

Orchestrated by `backend/app/services/scraper/media_fetcher.py` (runs concurrently):

| Asset                | Source module                                       |
| -------------------- | --------------------------------------------------- |
| Verifiable facts     | `scraper/wikipedia.py` (Wikipedia/Wikidata)         |
| Archival photos      | `scraper/wikimedia.py`, `scraper/internet_archive.py` |
| Stock B-roll         | `scraper/pexels.py`, `scraper/pixabay.py`           |
| Abstract / AI art    | `ai/flux.py` → `stabilityai/flux-1-dev` via NIM     |

`is_abstract_scene` selects between Flux generation and real archival fetching.

## 4. Next-gen video & character engine

- Narration + character timestamps: `backend/app/services/audio/elevenlabs.py`
  (`with-timestamps` endpoint, collapsed to word-level).
- Static-image animation: `backend/app/services/ai/wan21.py` →
  `AnyFlow-Wan2.1-T2V-14B` (4-second cinematic clips).
- Character cinematics: `backend/app/services/ai/character_engine.py`
  1. `is_historical_character` → `ai/liveportrait.py` (lip-sync)
  2. → `ai/deepvideo.py` (DeepVideo-V1 neural render: micro-expressions, temporal
     consistency, anti-flicker/warp).

## 5. Videographic assembly engine (Remotion + Motion.dev + FFmpeg)

- Orchestration framework: the `remotion/` project. `Documentary.tsx` sequences
  scenes; **Motion.dev (Framer Motion)** drives typographic/layout transitions
  inside `components/TitleOverlay.tsx`.
- Geopolitical maps: `remotion/src/scenes/MapScene.tsx` renders animated Mapbox
  sequences from each scene's `location_coordinates`.
- Subtitles: `remotion/src/components/Subtitles.tsx` burns center-bottom captions
  from ElevenLabs word timestamps.
- Master format: 21:9 (`remotion/src/constants.ts`, 2560×1097).
- Audio ducking (−85% under narration) + transition SFX (whoosh / deep boom):
  `backend/app/services/assembly/ffmpeg.py` (sidechain compression).
- Render bridge: `backend/app/services/assembly/remotion.py` builds input props
  and invokes the Remotion CLI.

## Background worker

`backend/app/services/pipeline.py` walks a video through every stage and persists
progress to Supabase. It executes inside the Celery worker
(`backend/app/workers/tasks.py`) so the API responds immediately and the dashboard
polls live status.

```
POST /api/generate-story
   │  (script synchronously, charge 1 credit)
   ▼
Celery: docuforge.generate_video
   ├─ facts (Wikipedia)
   ├─ per scene: media → narration → cinematics
   └─ Remotion render → FFmpeg finalize → output_url
```

> **Worker rendering note:** the render step shells out to the Remotion CLI, so the
> worker image bundles Node.js + Chromium libs (see `backend/Dockerfile`). Ensure
> `remotion/`'s npm deps are installed in the worker (mounted volume in
> `docker-compose.yml`); run `npm install` in `remotion/` once.

## Data flow summary

```
Next.js ──(Supabase JWT)──▶ FastAPI ──▶ Supabase (RLS)
                              │
                              └─▶ Celery ─▶ NIM / ElevenLabs / scrapers
                                       └─▶ Remotion + FFmpeg ─▶ 21:9 MP4
```
