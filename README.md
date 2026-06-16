# DocuForge AI - Subscription Documentary Video Generator SaaS

Production-oriented monorepo scaffold for an AI documentary platform with:
- **Frontend**: Next.js + React + Tailwind + Remotion + Motion.dev
- **Backend**: FastAPI + Supabase + Stripe + async scene workers
- **Pipelines**: LLM script generation, public web scraping/media fetching, narration synthesis, character animation, cinematic assembly

## Directory Structure

```text
.
├── backend
│   ├── app
│   │   ├── core
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db
│   │   │   └── supabase.py
│   │   ├── models
│   │   │   └── subscription.py
│   │   ├── schemas
│   │   │   └── story.py
│   │   ├── services
│   │   │   ├── audio_video_pipeline.py
│   │   │   ├── llm_router.py
│   │   │   ├── media_fetcher.py
│   │   │   ├── remotion_service.py
│   │   │   ├── scrapers.py
│   │   │   └── stripe_service.py
│   │   ├── workers
│   │   │   └── scene_asset_worker.py
│   │   └── main.py
│   ├── requirements.txt
│   └── supabase_schema.sql
├── frontend
│   ├── app
│   │   ├── api/remotion/render/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── dashboard/generation-form.tsx
│   │   ├── dashboard/project-queue.tsx
│   │   └── pricing-section.tsx
│   ├── lib
│   │   ├── api.ts
│   │   ├── supabase.ts
│   │   └── types.ts
│   └── video-composer
│       ├── index.ts
│       ├── root.tsx
│       ├── scenes/documentary-composition.tsx
│       └── widgets/geo-political-map.tsx
└── docker-compose.yml
```

## Implemented Requirements Mapping

### 1) Database, Subscription, Auth (Supabase + Stripe)
- Supabase schema and tables in `backend/supabase_schema.sql`:
  - `users` and `subscriptions` with required fields:
    - `plan_type`
    - `stripe_customer_id`
    - `video_credits_left`
    - `billing_cycle_end`
- Stripe webhook endpoint in `backend/app/main.py`:
  - `POST /api/webhooks/stripe`
  - Handles `customer.subscription.created`
  - Resets user credits to `30` through `reset_user_credits_for_subscription()`
- Frontend pricing cards:
  - `frontend/components/pricing-section.tsx`
  - Free and Pro plan cards, Pro linking to Stripe checkout URL.

### 2) SaaS Engine & Scripting Router (Llama 3.1 + Qwen 2.5)
- Authenticated endpoint:
  - `POST /api/generate-story`
  - Verifies Supabase JWT
  - Checks `video_credits_left > 0`
- Language model routing:
  - English -> `meta/llama-3.1-70b-instruct`
  - Hindi/Urdu/Roman -> `qwen/qwen-2.5-72b-instruct`
- Strict chronological JSON schema enforced via:
  - `StoryScene` model in `backend/app/schemas/story.py`
  - sequential validation in `validate_scene_sequence()`.

### 3) Public Data Scraper & Multi-source Media Fetcher
- Async scrapers in `backend/app/services/scrapers.py`:
  - Wikipedia API + Wikidata
  - Wikimedia Commons + Internet Archive
  - Pexels + Pixabay
- Abstract scene image generation:
  - NVIDIA NIM `stabilityai/flux-1-dev` in `media_fetcher.py`
- Orchestration worker:
  - `backend/app/workers/scene_asset_worker.py`.

### 4) Advanced Video & Character Engine
- ElevenLabs narration + timestamps:
  - `generate_voiceover_with_timestamps()` in `audio_video_pipeline.py`
- AnyFlow Wan2.1 animation:
  - `animate_static_image_to_video()`
- Historical character flow:
  - `run_liveportrait_lipsync()`
  - `run_deepvideo_v1_neural_render()`.

### 5) Videographic Assembly (Remotion + Motion + FFmpeg)
- Remotion composition:
  - `frontend/video-composer/scenes/documentary-composition.tsx`
- Motion.dev transitions:
  - Uses `motion/react` motion elements for procedural fades/scale.
- Geopolitical map sequences:
  - `frontend/video-composer/widgets/geo-political-map.tsx`
- Subtitle burn-in center-bottom:
  - rendered in composition using timestamp word windows.
- 21:9 output:
  - composition width/height = `2520x1080`
- FFmpeg ducking + SFX command builder:
  - `build_audio_ducking_ffmpeg_command()` in `remotion_service.py`.

## Run Locally

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Notes
- This scaffold is production-oriented in structure and interface contracts.
- External provider credentials and provider-specific payload fine-tuning are required before live deployment.
