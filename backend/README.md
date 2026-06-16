# DocuForge AI — Backend (FastAPI)

FastAPI service that exposes the SaaS API and drives the asynchronous
documentary-generation pipeline via Celery.

## Layout

```
app/
├── main.py                  FastAPI app + router wiring + static mounts
├── core/                    config, logging, JWT security
├── db/                      Supabase client factories
├── models/                  SQLAlchemy ORM (mirrors Supabase schema)
├── schemas/                 Pydantic request/response + strict scene contract
├── api/
│   ├── deps.py              auth + credit-gating dependencies
│   └── routes/              auth, generate-story, billing, videos, stripe webhook
├── services/
│   ├── nim_client.py        NVIDIA NIM (LLM / Flux / Wan2.1)
│   ├── scripting/           Llama 3.1 / Qwen 2.5 routing + prompts
│   ├── scraper/             Wikipedia, Wikimedia, Internet Archive, Pexels, Pixabay
│   ├── media/               Flux art + per-scene multi-source fetcher
│   ├── tts/                 ElevenLabs narration + word timestamps
│   ├── video/               Wan2.1, LivePortrait, DeepVideo-V1
│   ├── assembly/            timeline, maps, subtitles, ffmpeg, remotion
│   ├── stripe_service.py    checkout + webhook verification
│   ├── subscriptions.py     credit accounting
│   └── jobs.py              video_job persistence
├── workers/
│   ├── celery_app.py        Celery instance
│   ├── pipeline.py          end-to-end async orchestration
│   └── tasks.py             Celery task entrypoints
└── supabase/migrations/     SQL schema (run with `supabase db push`)
```

## Run locally

```bash
pip install -r requirements.txt
cp ../.env.example ../.env   # fill in keys (optional for dev — mocks kick in)

uvicorn app.main:app --reload                       # API → http://localhost:8000/docs
celery -A app.workers.celery_app.celery_app worker --loglevel=info   # worker
```

## Graceful degradation

Every external integration (NIM, ElevenLabs, Pexels, Pixabay, Stripe, Supabase,
LivePortrait, DeepVideo-V1, Remotion) detects missing credentials/binaries and
falls back to a safe mock so the full pipeline is runnable without secrets.

## Key endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/generate-story` | Bearer | 402 when `video_credits_left == 0` |
| POST | `/api/webhooks/stripe` | Stripe sig | resets Pro credits to 30 on `customer.subscription.created` |
| GET  | `/api/me/subscription` | Bearer | current plan + credits |
| GET  | `/api/videos` | Bearer | list jobs (poll for progress) |
| GET  | `/api/billing/plans` | public | Free / Pro catalogue |
| POST | `/api/billing/checkout` | Bearer | create Stripe Checkout session |
```
