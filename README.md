# 🎬 DocuForge AI — Subscription-Based AI Documentary Video Generator (SaaS)

DocuForge AI is a production-oriented SaaS platform that automates the creation of
premium, high-retention documentary videos in the visual language of channels like
**Mighty Monk** and **Vox**.

It combines large language models for scripting, automatic public web scraping for
verifiable archival media, neural character cinematics, and a Remotion-based
videographic assembly engine to render final **21:9 cinematic MP4** documentaries.

---

## ✨ Feature Overview

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router) + React + Tailwind CSS |
| Backend  | FastAPI (Python 3.11+) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Billing | Stripe (Subscriptions + Webhooks) |
| Scripting Router | Llama 3.1 70B (EN) / Qwen 2.5 72B (HI/UR/Roman) via NVIDIA NIM |
| Verifiable Facts | Wikipedia / Wikidata APIs |
| Archival Media | Wikimedia Commons + Internet Archive (archive.org) |
| Stock B-roll | Pexels + Pixabay |
| Abstract / AI Art | NVIDIA NIM `stabilityai/flux-1-dev` |
| Voiceover | ElevenLabs (audio + character-level timestamps) |
| Image → Motion | NVIDIA NIM `AnyFlow-Wan2.1-T2V-14B` |
| Character Cinematics | LivePortrait → DeepVideo-V1 |
| Video Assembly | Remotion.dev + Motion.dev (Framer Motion) + FFmpeg |
| Maps | Mapbox / Leaflet animated sequences |
| Async Pipeline | Celery + Redis background workers |

---

## 🗂️ Monorepo Structure

```
.
├── backend/        FastAPI service, scrapers, AI clients, Celery workers
├── frontend/       Next.js + Tailwind dashboard & marketing site
├── remotion/       Remotion video project (composition + scenes)
├── docker-compose.yml
└── .env.example    Single source-of-truth for all secrets
```

See each sub-package README for deeper detail:

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`remotion/README.md`](remotion/README.md)

---

## 🔄 End-to-End Pipeline

```
User prompt (topic + language)
        │
        ▼
[1] /api/generate-story  ──►  Scripting Router (Llama 3.1 / Qwen 2.5)
        │                       └─► strict chronological scene JSON
        ▼
[2] Celery job dispatched (video_credits_left decremented)
        │
        ├─► Scraper: Wikipedia/Wikidata facts
        ├─► Scraper: Wikimedia + Internet Archive archival media
        ├─► Scraper: Pexels + Pixabay B-roll
        └─► Flux-1-dev for abstract scenes
        │
        ▼
[3] ElevenLabs narration (.mp3 + word timestamps)
        ├─► Wan2.1 animates static images → 4s cinematic clips
        └─► LivePortrait → DeepVideo-V1 for historical characters
        │
        ▼
[4] Remotion + Motion.dev assembly
        ├─► animated Mapbox/Leaflet geopolitical sequences
        ├─► FFmpeg audio ducking (-85% music under VO)
        ├─► transition SFX (whoosh / deep boom)
        └─► burn-in centre-bottom subtitles
        │
        ▼
   Final 21:9 cinematic MP4  ──►  stored in Supabase Storage
```

---

## 🚀 Quick Start (Local Dev)

> Requires: Docker + Docker Compose, Node 20+, Python 3.11+, FFmpeg.

```bash
# 1. Clone & configure
cp .env.example .env            # fill in your API keys

# 2. Boot the whole stack (api, worker, redis, frontend)
docker compose up --build

# Frontend  → http://localhost:3000
# Backend   → http://localhost:8000/docs
```

### Run services individually

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# Celery worker (separate shell)
cd backend && celery -A app.workers.celery_app.celery_app worker --loglevel=info

# Frontend
cd frontend && npm install && npm run dev

# Remotion studio (preview compositions)
cd remotion && npm install && npm run dev
```

---

## 🔐 Environment Variables

All secrets live in a single root `.env` (see `.env.example`). The backend reads
them via `pydantic-settings`; the frontend reads the `NEXT_PUBLIC_*` subset.

Configure secrets for Cloud deployment in your hosting provider's secret manager.

---

## ⚖️ Legal & Ethical Notes

- Only **public-domain / openly-licensed** media is fetched (Wikimedia Commons,
  Internet Archive, Pexels, Pixabay). Always verify per-asset licensing before
  commercial publishing.
- Neural character re-animation (LivePortrait / DeepVideo-V1) of real people must
  comply with local likeness/deepfake laws. Use responsibly and add disclosure.

---

## 📦 Status

This repository ships the **full modular architecture, configuration boilerplate,
typed routes, service clients, and frontend components**. External AI calls are
implemented against their real HTTP contracts and degrade gracefully to mock
responses when API keys are absent — so the pipeline is runnable end-to-end in a
development environment.
