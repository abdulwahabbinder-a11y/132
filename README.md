# DocuForge AI

**Subscription-based AI Documentary Video Generator** — a production-ready SaaS platform that automates premium, high-retention documentary videos in the Vox and Mighty Monk YouTube style.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend (React + Tailwind)             │
│  Landing · Pricing · Dashboard · Auth (Supabase) · Stripe Checkout      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                         FastAPI Backend                                  │
│  /api/generate-story · /api/webhooks/stripe · /api/billing/checkout     │
└──────┬───────────────────┬────────────────────┬─────────────────────────┘
       │                   │                    │
┌──────▼──────┐   ┌────────▼────────┐   ┌──────▼──────────────────────┐
│  Supabase   │   │  Celery Worker  │   │  Remotion.dev Assembly      │
│  PostgreSQL │   │  Asset Pipeline │   │  Motion.dev · Mapbox · FFmpeg│
└─────────────┘   └────────┬────────┘   └─────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Llama 3.1          ElevenLabs          DeepVideo-V1
   Qwen 2.5           Wan2.1              LivePortrait
   Flux 1-dev          FFmpeg              Wikimedia/Pexels
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.12, Celery, Redis |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe Subscriptions |
| LLM | NVIDIA NIM — Llama 3.1 70B, Qwen 2.5 72B |
| TTS | ElevenLabs (word-level timestamps) |
| Image/Video AI | Flux 1-dev, Wan2.1 T2V, DeepVideo-V1, LivePortrait |
| Video Assembly | Remotion.dev, Motion.dev, FFmpeg |
| Maps | Mapbox / OpenStreetMap |
| Media Sources | Wikipedia, Wikidata, Wikimedia, Internet Archive, Pexels, Pixabay |

## Quick Start

### 1. Clone and configure

```bash
cp .env.example .env
# Fill in all API keys (Supabase, Stripe, NVIDIA NIM, ElevenLabs, etc.)
```

### 2. Set up Supabase

Run the migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

### 3. Start with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### 4. Local development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Celery worker:**
```bash
celery -A app.workers.background.celery_app worker --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Remotion studio:**
```bash
cd remotion
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-story` | Generate documentary script (auth required, checks credits) |
| `POST` | `/api/webhooks/stripe` | Stripe webhook handler |
| `POST` | `/api/billing/checkout` | Create Stripe checkout session |
| `GET` | `/api/subscription` | Get user subscription & credits |
| `GET` | `/api/jobs` | List video generation jobs |
| `GET` | `/health` | Health check |

## Subscription Plans

| Plan | Price | Credits | Features |
|------|-------|---------|----------|
| Free | $0 | 3 | English scripting, standard B-roll |
| Pro | $29/mo | 30 | All languages, DeepVideo-V1, 21:9 cinematic |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── config.py               # Settings & env vars
│   │   ├── dependencies.py         # Auth middleware
│   │   ├── models/                 # User & Subscription models
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── routers/                # API route handlers
│   │   ├── services/
│   │   │   ├── llm/                # Llama 3.1 & Qwen 2.5 router
│   │   │   ├── scrapers/           # Wikipedia, Wikimedia, Archive.org
│   │   │   ├── media/              # Pexels, Pixabay, Flux
│   │   │   ├── video/              # ElevenLabs, Wan2.1, DeepVideo, FFmpeg
│   │   │   └── asset_worker.py     # Background pipeline orchestrator
│   │   └── workers/                # Celery task definitions
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                        # Next.js App Router pages
│   ├── components/                 # React components
│   │   ├── PricingSection.tsx      # Free & Pro plan cards
│   │   └── dashboard/              # Dashboard components
│   └── lib/                        # Supabase & API clients
├── remotion/
│   └── src/                        # Remotion compositions
│       ├── DocumentaryComposition.tsx
│       └── components/             # SceneClip, MapSequence, Subtitles
├── supabase/
│   └── migrations/                 # PostgreSQL schema
├── docker-compose.yml
└── .env.example
```

## Stripe Webhook Setup

1. Create a Stripe product with a $29/month recurring price
2. Set `STRIPE_PRO_PRICE_ID` in `.env`
3. Forward webhooks to `/api/webhooks/stripe`:
   ```bash
   stripe listen --forward-to localhost:8000/api/webhooks/stripe
   ```
4. On `customer.subscription.created`, credits reset to 30

## License

MIT
