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
- Backend API: http://localhost:8080
- API docs: http://localhost:8080/docs

> **Production Docker:** use `docker compose up frontend` (built image).
> **Dev with hot reload:** use `docker compose up frontend-dev`.

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
# Easiest — kills stale servers and starts on http://localhost:3000
bash scripts/start-frontend.sh

# Or manually:
cd frontend
npm install
npm run dev
```

> If the page loads blank/unstyled, stop all Next.js processes (`pkill -f next`) and restart.
> Running `npm run dev` and `npm run start` at the same time breaks static assets.

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
| `POST` | `/api/shorts/generate` | Start viral short pipeline (Tavily/Jina → Llama → Flux → Remotion) |
| `GET` | `/api/shorts/{id}` | Get short job status + progress logs |
| `GET` | `/api/shorts/{id}/logs` | Poll pipeline log entries |
| `GET` | `/api/admin/settings` | Admin: list platform API keys |
| `PUT` | `/api/admin/settings` | Admin: update API keys in Supabase |
| `GET` | `/health` | Health check |

## Vidrush AI Clone — Viral Shorts

A production-ready viral short video wizard at `/shorts/wizard` with animated progress logs tracking:

1. **Web Scraping** — Tavily + Jina AI live research on the user's topic
2. **Scripting** — Llama 3.1 generates structured viral script JSON
3. **Asset Generation** — Flux 1-dev images (9:16) + ElevenLabs narration
4. **Rendering** — Remotion + FFmpeg local render with burned-in subtitles

### Admin Control

All API keys are stored in the Supabase `platform_settings` table and managed via `/admin`:

```sql
-- Grant admin access to a user
UPDATE public.users SET is_admin = true WHERE email = 'you@example.com';
```

Run migration `supabase/migrations/002_vidrush_shorts_and_settings.sql`, then configure keys in the admin dashboard. Keys fall back to `.env` if not set in Supabase.

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

## Deploy to docuforge.pro

### Google Cloud (recommended)

Full guide: **[deploy/gcp/DEPLOY.md](deploy/gcp/DEPLOY.md)**

```bash
export PROJECT_ID=your-gcp-project-id
bash deploy/gcp/setup-secrets.sh $PROJECT_ID
bash deploy/gcp/deploy.sh $PROJECT_ID
bash deploy/gcp/setup-domain.sh $PROJECT_ID docuforge.pro
```

Deploys to **Cloud Run**:
- `docuforge-frontend` → `https://docuforge.pro`
- `docuforge-api` → `https://api.docuforge.pro`
- `docuforge-worker` → Celery video pipeline

### Vercel (frontend only)

1. Import the repo on [Vercel](https://vercel.com) and set **Root Directory** to `frontend`
2. Add environment variables:
   - `NEXT_PUBLIC_SITE_URL=https://docuforge.pro`
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL=https://api.docuforge.pro/api` (or your backend URL)
3. In your domain registrar, add DNS records for `docuforge.pro`:
   - **A** or **CNAME** pointing to Vercel (Vercel dashboard shows exact values)
   - Optional: `www` → redirects to apex via `frontend/vercel.json`
4. In Vercel → **Domains**, add `docuforge.pro` and `www.docuforge.pro`

### Backend + Stripe

Set in production `.env`:

```bash
FRONTEND_URL=https://docuforge.pro
CORS_ORIGINS=https://docuforge.pro,https://www.docuforge.pro
```

Update Stripe webhook URL to your production API, e.g. `https://api.docuforge.pro/api/webhooks/stripe`.

### Email (support@docuforge.pro)

Configure MX records at your domain registrar (Google Workspace, Zoho, Cloudflare Email, etc.) so `support@docuforge.pro` receives mail.

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
