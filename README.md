# AI Documentary Video Generator SaaS

Production-focused monorepo scaffold for a subscription-based AI documentary platform inspired by high-retention editorial video formats such as Vox and Mighty Monk.

## Architecture

- `apps/web` - Next.js marketing site and authenticated dashboard built with React and Tailwind CSS
- `apps/api` - FastAPI backend for auth, subscriptions, scripting, asset orchestration, and video pipeline control
- `packages/video-composer` - Remotion + Motion.dev composition package for cinematic assembly, maps, subtitles, and transitions
- `supabase/migrations` - PostgreSQL schema for users, subscriptions, and generation jobs

## Core capabilities included

- Supabase-backed `users`, `subscriptions`, and `generation_jobs` schema
- Stripe webhook endpoint to sync plan state and refresh monthly credits
- Authenticated `/api/generate-story` pipeline entry point with credit enforcement
- NVIDIA NIM model routing for:
  - `meta/llama-3.1-70b-instruct` for English
  - `qwen/qwen-2.5-72b-instruct` for Hindi, Urdu, and Roman Urdu
  - `stabilityai/flux-1-dev` for abstract photorealistic artwork
  - `AnyFlow-Wan2.1-T2V-14B` for image-to-video animation
- Multi-source fact and media harvesting from Wikipedia, Wikidata, Wikimedia Commons, Internet Archive, Pexels, and Pixabay
- ElevenLabs narration synthesis with timestamp-aware subtitles
- Historical character routing for LivePortrait and DeepVideo-V1 enrichment
- Remotion-driven 21:9 cinematic render orchestration with map scenes and subtitle overlays

## Getting started

### Frontend

```bash
pnpm install
pnpm dev:web
```

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e apps/api
uvicorn app.main:app --app-dir apps/api --reload
```

### Required environment

Copy:

- `apps/web/.env.example` -> `apps/web/.env.local`
- `apps/api/.env.example` -> `apps/api/.env`

Populate:

- Supabase URL, anon key, service role key, and JWT secret
- Stripe secret key, webhook secret, and checkout links
- NVIDIA NIM, ElevenLabs, Mapbox, Pexels, Pixabay, and Internet Archive credentials

## Notes

- The repository is intentionally modular so the scraping, narration, rendering, and billing services can be split into separate workers later.
- External services are wired behind provider classes so they can be swapped for production implementations without rewriting the routing layer.
