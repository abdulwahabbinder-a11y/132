# DocuAI — AI Documentary Video Generator Platform

> Production-ready SaaS platform that automates premium, high-retention documentary videos in the style of **Vox**, **BBC**, and **Mighty Monk** — fully end-to-end with zero manual intervention.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DocuAI Platform                          │
├────────────────────────┬────────────────────────────────────┤
│   Next.js 15 Frontend  │      FastAPI Python Backend        │
│   React + Tailwind CSS │      PostgreSQL (Supabase)         │
│   Remotion.dev + Motion│      Redis + Background Workers    │
│   Mapbox / Leaflet     │      Stripe Webhooks               │
└────────────────────────┴────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐        ┌──────────────────────────────┐
│  Supabase Auth   │        │    AI Pipeline Services       │
│  Stripe Billing  │        │  ┌────────────────────────┐  │
└──────────────────┘        │  │ LLM Scripting           │  │
                            │  │ Llama 3.1 (EN) via NIM  │  │
                            │  │ Qwen 2.5 (HI/UR/RO)     │  │
                            │  └────────────────────────┘  │
                            │  ┌────────────────────────┐  │
                            │  │ Media Scraping          │  │
                            │  │ Wikipedia + Wikimedia   │  │
                            │  │ Archive.org             │  │
                            │  │ Pexels + Pixabay        │  │
                            │  └────────────────────────┘  │
                            │  ┌────────────────────────┐  │
                            │  │ AI Generation           │  │
                            │  │ Flux-1-dev (NVIDIA NIM) │  │
                            │  │ ElevenLabs TTS          │  │
                            │  │ Wan2.1 Animation        │  │
                            │  │ LivePortrait Lip-sync   │  │
                            │  │ DeepVideo-V1 Rendering  │  │
                            │  └────────────────────────┘  │
                            │  ┌────────────────────────┐  │
                            │  │ Assembly                │  │
                            │  │ Remotion.dev            │  │
                            │  │ Motion.dev              │  │
                            │  │ Mapbox Geo Maps         │  │
                            │  │ FFmpeg Audio Ducking    │  │
                            │  │ 21:9 4K MP4 Export      │  │
                            │  └────────────────────────┘  │
                            └──────────────────────────────┘
```

---

## Directory Structure

```
/workspace
├── backend/                     # FastAPI Python backend
│   ├── main.py                  # App entry point
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── migrations/
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   └── app/
│       ├── config.py            # Pydantic settings (env vars)
│       ├── database.py          # SQLAlchemy async engine + Supabase client
│       ├── models/
│       │   ├── user.py          # User model
│       │   ├── subscription.py  # Subscription + plan_type + credits
│       │   └── video_project.py # VideoProject + VideoScene
│       ├── api/
│       │   ├── auth.py          # JWT auth (register, login, /me)
│       │   ├── generate_story.py # POST /api/generate-story (credit check + LLM)
│       │   ├── webhooks.py      # POST /api/webhooks/stripe
│       │   └── videos.py        # CRUD for video projects
│       ├── services/
│       │   ├── llm_service.py   # Llama 3.1 + Qwen 2.5 via NVIDIA NIM
│       │   ├── scraper_service.py # Wikipedia, Wikimedia, Archive.org, Pexels, Pixabay, Flux
│       │   ├── elevenlabs_service.py # TTS + word timestamps
│       │   └── video_service.py # Wan2.1, LivePortrait, DeepVideo-V1, FFmpeg assembly
│       └── workers/
│           └── media_worker.py  # Full async background pipeline
│
├── frontend/                    # Next.js 15 frontend
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx           # Root layout + providers
│   │   ├── page.tsx             # Landing page
│   │   ├── providers.tsx        # React Query provider
│   │   ├── globals.css          # Tailwind + custom styles
│   │   ├── dashboard/page.tsx   # Protected dashboard
│   │   ├── pricing/page.tsx     # Pricing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── api/stripe/          # Server-side Stripe API routes
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx       # Responsive nav + auth state
│   │   │   └── Footer.tsx
│   │   ├── HeroSection.tsx      # Landing hero with 21:9 preview
│   │   ├── FeaturesSection.tsx  # 9-feature grid
│   │   ├── HowItWorksSection.tsx # 6-step pipeline
│   │   ├── ShowcaseSection.tsx  # Sample video cards
│   │   ├── PricingSection.tsx   # Free ($0) + Pro ($29) cards + Stripe CTA
│   │   ├── Dashboard.tsx        # Main dashboard with video grid
│   │   ├── VideoCard.tsx        # Video card with progress + status
│   │   └── VideoGenerator.tsx   # New documentary modal with all options
│   ├── lib/
│   │   ├── supabase.ts          # Supabase browser client
│   │   ├── stripe.ts            # Stripe helpers + PLANS config
│   │   ├── api.ts               # Axios API client + TypeScript types
│   │   └── utils.ts             # cn(), formatDuration(), STATUS_LABELS
│   └── remotion/                # Remotion video composition
│       ├── index.ts             # registerRoot
│       ├── Root.tsx             # Composition registry
│       ├── types.ts             # Shared TypeScript types
│       ├── compositions/
│       │   └── DocumentaryVideo.tsx  # Main video composition
│       └── components/
│           ├── TitleCard.tsx        # Animated title sequence
│           ├── SceneComposition.tsx # Per-scene media + Ken Burns
│           ├── SubtitleOverlay.tsx  # Word-synced center-bottom subtitles
│           ├── TransitionOverlay.tsx # Fade transitions
│           └── GeopoliticalMap.tsx  # Mapbox animated map sequences
│
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
├── .env.example                 # All required env vars documented
└── README.md
```

---

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/your-org/docuai.git
cd docuai
cp .env.example .env
# Fill in all API keys in .env
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### 3. Run Alembic migrations

```bash
cd backend
alembic upgrade head
```

---

## Manual Development Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Remotion Studio

```bash
cd frontend
npm run remotion:studio
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (creates free subscription) |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/me` | Get current user |

### Story Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-story` | Generate script + kick off full pipeline |

**Request body:**
```json
{
  "topic": "The Fall of the Roman Empire",
  "language": "en",
  "style": "documentary",
  "aspect_ratio": "21:9",
  "num_scenes": 8
}
```

**Response:** `202 Accepted` with `project_id` + scenes + `credits_remaining`

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos` | List all user videos |
| GET | `/api/videos/{id}` | Get video details + scenes |
| GET | `/api/videos/{id}/status` | Poll generation status |
| DELETE | `/api/videos/{id}` | Delete video project |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/stripe` | Handle Stripe subscription events |

**Handled events:**
- `customer.subscription.created` → Sets plan to Pro, resets credits to **30**
- `customer.subscription.updated` → Syncs status
- `customer.subscription.deleted` → Reverts to Free
- `invoice.payment_succeeded` → Resets credits to **30** on renewal
- `invoice.payment_failed` → Sets status to `past_due`

---

## Subscription Plans

| Feature | Free ($0) | Pro ($29/mo) |
|---------|-----------|-------------|
| Video credits | 3/month | 30/month |
| Output quality | HD 1080p | 4K 21:9 Cinematic |
| LLM scripting | ✅ | ✅ Llama 3.1 + Qwen 2.5 |
| Media scraping | ✅ | ✅ Wikipedia + Wikimedia + Archive.org |
| Stock footage | ✅ | ✅ Pexels + Pixabay |
| Flux AI art | ❌ | ✅ stabilityai/flux-1-dev |
| ElevenLabs TTS | ❌ | ✅ With word timestamps |
| Wan2.1 animation | ❌ | ✅ 4-second cinematic clips |
| LivePortrait lip-sync | ❌ | ✅ |
| DeepVideo-V1 rendering | ❌ | ✅ |
| Geopolitical maps | ❌ | ✅ Mapbox animated |
| Audio ducking | ❌ | ✅ 85% BG music reduction |
| Subtitle burn-in | Basic | ✅ Word-level synced |

---

## Video Pipeline Stages

```
pending → scripting → fetching_media → generating_audio → animating → assembling → rendering → completed
                                                                                              ↘ failed
```

Each stage updates `progress_percent` (0–100) in the database. The frontend polls `/api/videos/{id}/status` every 5 seconds for active projects.

---

## AI Models Used

| Task | Model | Provider |
|------|-------|----------|
| English scripting | `meta/llama-3.1-70b-instruct` | NVIDIA NIM |
| Hindi/Urdu scripting | `qwen/qwen-2.5-72b-instruct` | NVIDIA NIM |
| Abstract image generation | `stabilityai/flux-1-dev` | NVIDIA NIM |
| Image animation | `nvidia/AnyFlow-Wan2.1-T2V-14B` | NVIDIA NIM |
| Voice synthesis + timestamps | ElevenLabs Turbo v2.5 | ElevenLabs |
| Lip-sync | LivePortrait | Self-hosted / API |
| Neural character rendering | DeepVideo-V1 | Self-hosted / API |

---

## Required API Keys

| Service | Purpose | Get From |
|---------|---------|----------|
| Supabase | Database + Auth | [app.supabase.com](https://app.supabase.com) |
| Stripe | Payments + Webhooks | [dashboard.stripe.com](https://dashboard.stripe.com) |
| NVIDIA NIM | LLM + Flux + Wan2.1 | [build.nvidia.com](https://build.nvidia.com) |
| ElevenLabs | TTS + timestamps | [elevenlabs.io](https://elevenlabs.io) |
| Pexels | Stock footage | [pexels.com/api](https://www.pexels.com/api/) |
| Pixabay | Stock footage fallback | [pixabay.com/api](https://pixabay.com/api/docs/) |
| Mapbox | Geopolitical maps | [account.mapbox.com](https://account.mapbox.com) |

---

## License

MIT © DocuAI
