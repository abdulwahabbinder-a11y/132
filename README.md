# AI Documentary Video Generator SaaS

Production-oriented scaffold for a subscription-based AI documentary video platform using:

- **Frontend:** Next.js App Router, React, Tailwind CSS, Motion.dev, Remotion
- **Backend:** FastAPI, SQLAlchemy, Celery, Redis
- **Data/Auth/Billing:** Supabase PostgreSQL, Supabase JWT auth, Stripe subscriptions
- **AI & Media Providers:** NVIDIA NIM, ElevenLabs, Wikimedia Commons, Internet Archive, Pexels, Pixabay

## Repository Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── models.py
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── story.py
│   │   │   └── stripe.py
│   │   ├── services/
│   │   │   ├── llm.py
│   │   │   ├── media_pipeline.py
│   │   │   ├── providers.py
│   │   │   └── video_assembly.py
│   │   └── workers/
│   │       ├── celery_app.py
│   │       └── tasks.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── src/app/
│   │   ├── dashboard/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── src/components/
│   │   ├── dashboard/
│   │   └── pricing-section.tsx
│   ├── src/lib/
│   │   ├── api.ts
│   │   ├── env.ts
│   │   └── supabase/
│   ├── src/remotion/
│   │   ├── DocumentaryComposition.tsx
│   │   ├── Root.tsx
│   │   └── index.ts
│   ├── Dockerfile
│   └── remotion.config.ts
├── .env.example
└── docker-compose.yml
```

## Implemented SaaS Requirements

### 1) Database, Subscription, and Auth

- SQLAlchemy models for:
  - `users`
  - `subscriptions`
  - `video_projects`
  - `scene_assets`
- Stripe webhook endpoint:
  - `POST /api/webhooks/stripe`
  - Handles `customer.subscription.created`
  - Resets credits to **30**
  - Updates billing cycle end, Stripe customer ID, and plan state
- Supabase JWT verification dependency that auto-provisions first-party user records
- Frontend pricing section with:
  - **Free Plan ($0)**
  - **Pro Plan ($29/month)**

### 2) SaaS Engine and Scripting Router

- Authenticated `POST /api/generate-story`
- Enforces `video_credits_left > 0`
- Language routing:
  - English -> `meta/llama-3.1-70b-instruct`
  - Hindi / Urdu / Roman -> `qwen/qwen-2.5-72b-instruct`
- Strict chronological JSON schema for every scene:
  - `scene_number`
  - `narration_text`
  - `visual_keywords`
  - `is_abstract_scene`
  - `is_historical_character`
  - `character_name`
  - `location_coordinates`

### 3) Public Data Scraper and Media Fetcher

- Wikipedia summary + Wikidata timeline fact lookup
- Wikimedia Commons media discovery
- Internet Archive metadata retrieval
- Pexels video search
- Pixabay video search
- Flux image generation path for abstract scenes

### 4) Video and Character Engine

- ElevenLabs narration generation with timestamp capture manifest
- Wan 2.1 image-to-motion generation hook
- LivePortrait lip-sync integration hook
- DeepVideo-V1 render hook for historical character scenes

### 5) Assembly Engine

- Remotion composition scaffold for 21:9 exports
- Motion.dev overlay transitions inside the composition
- Animated map panel driven by `location_coordinates`
- FFmpeg ducking-ready post-process helper
- Subtitle rendering region centered at bottom of frame

## Environment

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Important variables:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NVIDIA_NIM_API_KEY`
- `ELEVENLABS_API_KEY`
- `PEXELS_API_KEY`
- `PIXABAY_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_FREE_PLAN_URL`
- `NEXT_PUBLIC_STRIPE_PRO_PLAN_URL`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Worker

```bash
cd backend
celery -A app.workers.celery_app.celery_app worker --loglevel=info
```

### Docker Compose

```bash
docker compose up --build
```

## Notes

- This repo is a **complete modular scaffold** for the requested SaaS architecture.
- External providers still require valid API keys and, for some advanced video endpoints such as DeepVideo-V1 and LivePortrait, a reachable hosted service.
- The backend currently uses `metadata.create_all()` on startup for convenience. For a stricter production rollout, layer Alembic migrations over the existing models.
