# DocuGen — AI Documentary Video Generator (SaaS)

> Production-ready scaffold for a subscription SaaS that auto-produces premium,
> high-retention documentary videos in the style of **Mighty Monk** and **Vox**.

This monorepo wires together LLM scripting (Llama 3.1 / Qwen 2.5 on **NVIDIA
NIM**), public-source asset scraping (Wikipedia, Wikimedia, Internet Archive,
Pexels, Pixabay), AI image & video synthesis (**Flux.1-dev**, **Wan2.1**,
**LivePortrait**, **DeepVideo-V1**), neural narration (**ElevenLabs**), and a
**Remotion.dev** + **Motion.dev** composition engine — finished with FFmpeg
audio ducking, subtitle burn-in and 21:9 cinematic export.

```
┌───────────────────┐    ┌────────────────────┐    ┌───────────────────────┐
│  Next.js / React  │ ─► │  FastAPI (Python)  │ ─► │  Celery worker        │
│  Tailwind + SWR   │    │  Supabase + Stripe │    │  scrape → tts → AI    │
└───────────────────┘    └────────────────────┘    │  → Remotion → FFmpeg  │
                                                   └───────────┬───────────┘
                                                               ▼
                                                       Supabase Storage
                                                       (final 21:9 MP4)
```

## Repository layout

```
.
├── backend/                    # FastAPI + Celery
│   ├── app/
│   │   ├── api/                # Routers (stripe webhook, generate-story, …)
│   │   ├── core/               # Auth, logging
│   │   ├── schemas/            # Pydantic contracts
│   │   ├── services/
│   │   │   ├── llm_router.py   # Llama 3.1 (EN) / Qwen 2.5 (HI/UR/Roman)
│   │   │   ├── scraper/        # Wikipedia, Wikimedia, IA, Pexels, Pixabay
│   │   │   ├── ai_media/       # Flux, Wan2.1, LivePortrait, DeepVideo-V1
│   │   │   ├── tts/            # ElevenLabs (audio + word timestamps)
│   │   │   ├── video/          # Remotion bridge + FFmpeg post
│   │   │   └── maps/           # Mapbox helpers
│   │   ├── workers/            # Celery app + end-to-end pipeline
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Next.js 14 (App Router) + Tailwind + SWR
│   ├── app/                    # Landing, /pricing, /dashboard, /generate
│   ├── components/             # PricingSection, Navbar, dashboard widgets
│   ├── lib/                    # Supabase client, typed API
│   └── package.json
├── remotion/                   # Remotion 4 + Framer Motion compositions
│   ├── src/
│   │   ├── Root.tsx
│   │   ├── DocumentaryComposition.tsx
│   │   ├── scenes/             # Archival, Abstract, Character, Map
│   │   └── components/         # Subtitle, AnimatedTitle, MapAnimation
│   └── remotion.config.ts
├── supabase/migrations/        # 001_init.sql (users, subscriptions, videos)
└── docker-compose.yml          # api · worker · redis · frontend · remotion
```

## Quickstart

```bash
# 1) Backend env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2) Provision Supabase
supabase db push   # or paste supabase/migrations/001_init.sql in the SQL editor

# 3) Launch the whole stack
docker compose up --build
# Frontend  → http://localhost:3000
# API       → http://localhost:8000/docs
# Remotion  → http://localhost:3030
```

## Required secrets

Add the following in **Cursor → Cloud Agents → Secrets** (so future agents
inherit them) or your local `.env`:

| Secret                    | Used by                                       |
| ------------------------- | --------------------------------------------- |
| `SUPABASE_*`              | DB + auth                                     |
| `STRIPE_*`                | Checkout + webhook + portal                   |
| `NVIDIA_NIM_API_KEY`      | Llama 3.1, Qwen 2.5, Flux, Wan2.1, LivePortrait, DeepVideo-V1 |
| `ELEVENLABS_API_KEY`      | TTS narration + char/word timestamps          |
| `PEXELS_API_KEY`          | Stock B-roll                                  |
| `PIXABAY_API_KEY`         | Stock B-roll (secondary)                      |
| `MAPBOX_ACCESS_TOKEN`     | Animated geopolitical map scenes              |

## Pipeline at a glance

1. **Auth & credits** — Supabase JWT → `current_user` dependency → check
   `video_credits_left > 0`, atomically decrement.
2. **Scripting** — `services/llm_router.py` picks Llama 3.1 (English) or Qwen
   2.5 (Hindi / Urdu / Roman) on NVIDIA NIM and enforces the strict scene-JSON
   schema in `schemas/story.py`.
3. **Stripe webhook** — `customer.subscription.created` →
   `video_credits_left = PRO_PLAN_CREDITS (30)`. Renewals re-top credits.
4. **Async pipeline** (Celery) — per-scene fan-out:
   - Verifiable facts from **Wikipedia** REST + Wikidata SPARQL.
   - Archival imagery from **Wikimedia Commons** + **Internet Archive**.
   - B-roll from **Pexels** and **Pixabay**.
   - Abstract scenes → **NVIDIA NIM Flux.1-dev** still → **Wan2.1** animation.
   - Historical characters → **LivePortrait** lip-sync → **DeepVideo-V1**
     neural rendering for micro-expressions and temporal consistency.
   - Narration via **ElevenLabs** (`with-timestamps`) → MP3 + word timestamps.
5. **Composition** — Remotion `DocumentaryComposition` orchestrates scenes,
   uses Framer Motion (Motion.dev) for layout transitions, and a
   `MapAnimation` component that fly-throughs Mapbox GL waypoints.
6. **Post** — FFmpeg: sidechain audio ducking (-15 dB on the music bed under
   narration), transition SFX (Whoosh / Deep Boom), ASS subtitle burn-in from
   ElevenLabs word timestamps, final crop/pad to **21:9** (`2520x1080`) H.264.

## Endpoints

| Method | Route                          | Purpose                            |
| ------ | ------------------------------ | ---------------------------------- |
| GET    | `/health`                      | Service health                     |
| POST   | `/api/webhooks/stripe`         | Stripe events (signature-verified) |
| GET    | `/api/subscription`            | Current plan + credit balance      |
| POST   | `/api/billing/checkout`        | Create Stripe Checkout session     |
| POST   | `/api/billing/portal`          | Stripe customer portal session     |
| POST   | `/api/generate-story`          | Credit-gated LLM scripting + queue |
| GET    | `/api/videos`                  | List user's videos                 |
| GET    | `/api/videos/{id}`             | Single video + progress            |

## Frontend pages

| Path                         | Component                                       |
| ---------------------------- | ----------------------------------------------- |
| `/`                          | Landing hero + features + `PricingSection`      |
| `/pricing`                   | `PricingSection` (Free $0 / Pro $29)            |
| `/auth/sign-up`              | Supabase email signup                           |
| `/dashboard`                 | `CreditMeter` + grid of `VideoCard`s            |
| `/dashboard/videos/[id]`     | Live progress + 21:9 player                     |
| `/generate`                  | `GenerateForm` (topic, language, tone, length)  |

## Notes on production hardening

- Replace the placeholder `output_url` upload in
  `workers/video_pipeline.py` with a real Supabase Storage / S3 multipart
  upload before going live.
- The NVIDIA NIM payload shapes (`flux.py`, `wan21.py`, `liveportrait.py`,
  `deepvideo.py`) follow the documented `/<model>/infer` convention; verify
  field names against your NIM deployment's OpenAPI before launch.
- Add HMAC-verified Slack/Discord alerts in
  `_update_progress(..., status="failed", ...)` for production monitoring.
- Music bed + SFX files live in `backend/assets/{music,sfx}/` — see the
  per-folder READMEs.
