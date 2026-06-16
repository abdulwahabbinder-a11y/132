# AI Documentary Video Generator SaaS

Production-ready modular scaffold for a subscription-based documentary generation platform:

- **Frontend**: Next.js + React + Tailwind CSS
- **Backend**: FastAPI + Supabase PostgreSQL + Stripe webhook handling
- **Video Pipeline**: NVIDIA NIM (Llama 3.1 / Qwen 2.5 / Flux / Wan2.1 / DeepVideo-V1), ElevenLabs, LivePortrait
- **Assembly**: Remotion.dev + Motion.dev + FFmpeg (ducking, SFX, 21:9 export)

---

## Monorepo Structure

```text
.
├── backend
│   ├── app
│   │   ├── api
│   │   │   ├── deps.py
│   │   │   └── routes
│   │   │       ├── auth.py
│   │   │       ├── billing.py
│   │   │       └── story.py
│   │   ├── core
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models
│   │   │   ├── subscription.py
│   │   │   ├── user.py
│   │   │   └── video_job.py
│   │   ├── schemas
│   │   │   └── story.py
│   │   ├── services
│   │   │   ├── nim_client.py
│   │   │   ├── story_service.py
│   │   │   ├── scraper_service.py
│   │   │   ├── media_fetcher_service.py
│   │   │   ├── tts_service.py
│   │   │   ├── animation_service.py
│   │   │   ├── character_engine_service.py
│   │   │   ├── remotion_service.py
│   │   │   ├── ffmpeg_service.py
│   │   │   └── video_pipeline_service.py
│   │   ├── workers
│   │   │   └── pipeline_worker.py
│   │   └── main.py
│   └── pyproject.toml
├── frontend
│   ├── app
│   │   ├── dashboard/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── pricing-section.tsx
│   │   └── dashboard
│   │       ├── generator-form.tsx
│   │       └── job-card.tsx
│   └── lib
│       ├── api.ts
│       ├── supabase.ts
│       └── types.ts
├── video-engine
│   └── src
│       ├── DocumentaryComposition.tsx
│       ├── Root.tsx
│       ├── index.ts
│       └── render.js
├── .env.example
└── docker-compose.yml
```

---

## Implemented Requirements Mapping

### 1) Database, Subscription, Auth (Supabase + Stripe)

- PostgreSQL models created: `users`, `subscriptions`.
- Subscription fields implemented:
  - `plan_type`
  - `stripe_customer_id`
  - `video_credits_left`
  - `billing_cycle_end`
- Stripe webhook endpoint:
  - `POST /api/webhooks/stripe`
  - Handles `customer.subscription.created`
  - Resets credits to `30` and updates cycle end.
- Frontend pricing section includes:
  - **Free Plan ($0)**
  - **Pro Plan ($29/month)**
  - Stripe checkout links via environment variables.

### 2) SaaS Scripting Router (Llama 3.1 + Qwen 2.5)

- Authenticated endpoint: `POST /api/generate-story`.
- Validates remaining credits (`video_credits_left > 0`).
- Language model router:
  - English → `meta/llama-3.1-70b-instruct`
  - Hindi/Urdu/Roman → `qwen/qwen-2.5-72b-instruct`
- Strict chronological scene JSON enforced with required fields:
  - `scene_number`
  - `narration_text`
  - `visual_keywords`
  - `is_abstract_scene`
  - `is_historical_character`
  - `character_name`
  - `location_coordinates`

### 3) Public Data Scraper + Multi-source Media Fetcher

- Async worker orchestrates per-scene ingestion.
- Verifiable facts:
  - Wikipedia API
  - Wikidata API
- Archival media:
  - Wikimedia Commons API
  - Internet Archive API
- Stock video:
  - Pexels API
  - Pixabay API
- Abstract scenes:
  - NVIDIA NIM `stabilityai/flux-1-dev`

### 4) Advanced Character/Video Engine

- ElevenLabs narration generation + timestamp support for subtitles.
- Image animation:
  - NVIDIA NIM `AnyFlow-Wan2.1-T2V-14B`
- Historical character pipeline:
  1. LivePortrait lip sync
  2. DeepVideo-V1 enhancement stage for temporal stability and realism

### 5) Videographic Assembly (Remotion + Motion.dev + FFmpeg)

- Remotion core composition (21:9 at 2520x1080).
- Motion.dev animation layer integrated in scene overlays.
- Geopolitical maps:
  - Mapbox static map URL generated from `location_coordinates`.
- FFmpeg post-processing service for:
  - 85% background music ducking during voice
  - transition SFX insertion (whoosh/deep boom)
- Subtitle layer implemented in composition at center-bottom.

---

## Quick Start

1. Copy env file:

```bash
cp .env.example .env
```

2. Start local stack:

```bash
docker compose up --build
```

3. Access:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000/docs`

---

## Production Notes

- Replace table auto-creation with Alembic migrations before production launch.
- Configure signed object storage (e.g., S3/Supabase Storage) for render artifacts.
- Move in-memory worker queue to a durable broker (Redis + Celery/RQ/Arq) for scale.
- Add per-provider retry, circuit breaker, and idempotency handling for pipeline calls.
