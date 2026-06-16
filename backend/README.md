# DocuGen AI · Backend

FastAPI + Celery service that powers the documentary generation pipeline.

## Modules

```
app/
├── api/routes/           # FastAPI route modules (stories, videos, subscriptions, webhooks)
├── core/                 # config, logging, supabase client, JWT auth dep
├── db/                   # SQLAlchemy async session + SQL migrations
├── models/               # ORM models: User, Subscription, VideoJob
├── schemas/              # Pydantic contracts (incl. strict scene schema)
├── services/
│   ├── llm/              # NVIDIA NIM client + Llama 3.1 / Qwen 2.5 router
│   ├── scrapers/         # Wikipedia, Wikimedia, Internet Archive, Pexels, Pixabay
│   ├── media/            # Flux 1-dev, ElevenLabs, Wan 2.1, LivePortrait, DeepVideo-V1
│   ├── assembly/         # Remotion runner, FFmpeg duck/subtitles/encode
│   ├── stripe/           # Stripe SDK helpers + webhook parser
│   └── storage.py        # Supabase Storage uploader
└── workers/              # Celery app, pipeline orchestrator, task entrypoints
```

## Routes

| Method | Path                     | Purpose                                                   |
|--------|--------------------------|-----------------------------------------------------------|
| POST   | `/api/generate-story`    | Credit-gated scripting. Routes EN→Llama, others→Qwen.     |
| GET    | `/api/videos`            | List the caller's video jobs.                             |
| GET    | `/api/videos/{id}`       | Inspect a single job (status, output URL).                |
| GET    | `/api/subscriptions/me`  | Current plan + credits remaining.                         |
| POST   | `/api/subscriptions/checkout` | Create a Stripe Checkout session (Pro plan).         |
| POST   | `/api/webhooks/stripe`   | Stripe webhook. Resets credits=30 on subscription.created.|

## Local run

```bash
pip install -r requirements.txt
cp ../.env.example ../.env
psql $DATABASE_URL -f app/db/migrations/001_initial.sql
uvicorn app.main:app --reload
celery -A app.workers.celery_app.celery worker --loglevel=info
```

## Pipeline order

1. `/api/generate-story` → NIM scripting → persist `VideoJob.story_json`
2. Celery `docugen.pipeline.run` → `app.workers.pipeline.run_full_pipeline`
3. Per-scene scraping + Flux / Wan 2.1 / LivePortrait / DeepVideo-V1
4. Remotion render → FFmpeg subtitles, transitions, ducking, 21:9 encode
5. Upload to Supabase Storage → `VideoJob.output_url`
