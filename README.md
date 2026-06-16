# DocuForge AI — Subscription-Based AI Documentary Video Generator

DocuForge AI is a production-oriented SaaS platform that automates the creation of
premium, high-retention documentary videos in the style of channels like **Mighty Monk**
and **Vox**.

It combines an LLM scripting router, automatic public web scraping, multi-source media
fetching, next-gen character cinematics, and a Remotion-based assembly engine to render
cinematic **21:9 MP4** documentaries end-to-end.

```
                ┌──────────────┐     ┌───────────────────────┐
   User ─────▶  │  Next.js UI  │ ──▶ │  FastAPI SaaS Engine   │
                └──────────────┘     └───────────┬───────────┘
                       │                          │
              Supabase Auth / Stripe       Celery background worker
                                                  │
        ┌─────────────────────────────────────────────────────────────┐
        │ 1. Scripting Router (Llama 3.1 / Qwen 2.5 via NVIDIA NIM)     │
        │ 2. Public Scraper (Wikipedia, Wikimedia, Internet Archive)    │
        │ 3. Media Fetcher (Pexels, Pixabay, Flux T2I)                  │
        │ 4. Character Engine (ElevenLabs, Wan2.1, LivePortrait,        │
        │    DeepVideo-V1)                                              │
        │ 5. Assembly Engine (Remotion + Motion.dev + FFmpeg + Mapbox)  │
        └─────────────────────────────────────────────────────────────┘
```

## Monorepo Layout

| Path        | Stack                                   | Purpose                                            |
| ----------- | --------------------------------------- | -------------------------------------------------- |
| `backend/`  | FastAPI (Python 3.11), Celery, Supabase | SaaS engine, scripting router, scraper, AI clients |
| `frontend/` | Next.js 14 (App Router), Tailwind CSS   | Marketing site, pricing, auth, dashboard           |
| `remotion/` | Remotion + Motion.dev (Framer Motion)   | Programmatic video orchestration & rendering       |
| `supabase/` | SQL migrations                          | `users`, `subscriptions`, `videos`, `scenes`       |

## Architecture overview

The full pipeline is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Quick start (local dev)

```bash
# 0. Copy env templates and fill in your API keys
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 1. Start infra (Postgres, Redis) + backend + worker
docker compose up --build

# 2. Frontend (separate terminal)
cd frontend && npm install && npm run dev

# 3. Remotion studio (optional, for previewing comps)
cd remotion && npm install && npm run dev
```

- Frontend: http://localhost:3000
- Backend API + docs: http://localhost:8000/docs

## Environment variables

See [`.env.example`](.env.example) for the full list. Every external integration
(Supabase, Stripe, NVIDIA NIM, ElevenLabs, Pexels, Pixabay, Mapbox) is configured via
environment variables and degrades gracefully (returns a clear error) when a key is
missing, so you can run and explore the system incrementally.

## Status

This repository is a **complete modular skeleton** with working configuration,
typed routes, service clients, and UI components. External model calls (NIM, ElevenLabs,
DeepVideo-V1, LivePortrait, Wan2.1) are implemented as real HTTP clients; supply the
corresponding credentials to enable live generation. Long-running render steps are wired
through a Celery worker so the API stays responsive.
