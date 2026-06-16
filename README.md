# DocuGen AI – Subscription Documentary Video Generator

DocuGen AI is a production-ready SaaS platform that automates the creation of
premium, high-retention documentary videos in the style of *Mighty Monk* and
*Vox*. The platform combines large-language scripting, public-web archival
scraping, NVIDIA NIM character cinematics (Flux • Wan 2.1 • LivePortrait •
DeepVideo-V1), ElevenLabs narration, and a Remotion + Motion.dev compositor to
output cinematic 21:9 MP4s.

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│   Next.js    │───▶│  FastAPI Gateway │───▶│   Pipeline Workers   │
│  (frontend)  │    │ (auth + billing) │    │ (LLM • scrape • TTS) │
└──────────────┘    └──────────────────┘    └──────────┬───────────┘
        │                   │                          │
        ▼                   ▼                          ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  Supabase /  │    │  Stripe Billing  │    │ Remotion + FFmpeg    │
│  Postgres    │    │   Webhooks       │    │ (21:9 MP4 render)    │
└──────────────┘    └──────────────────┘    └──────────────────────┘
```

## Repository layout

| Path        | Purpose                                                                      |
|-------------|------------------------------------------------------------------------------|
| `backend/`  | FastAPI app, Celery workers, scrapers, NVIDIA NIM clients, Stripe webhooks.  |
| `frontend/` | Next.js (App Router) + Tailwind CSS marketing site, pricing & user dashboard.|
| `remotion/` | Remotion composition with Motion.dev transitions, maps, subtitles, audio.    |
| `infra/`    | docker-compose for local development and supporting services.                |

## Subsystems

1. **Auth + Billing** – Supabase Postgres, Stripe Checkout, `stripe.webhook` ⇒
   resets `video_credits_left` to 30 on `customer.subscription.created`.
2. **Scripting Router** – `meta/llama-3.1-70b-instruct` (English) or
   `qwen/qwen-2.5-72b-instruct` (Hindi / Urdu / Roman) via NVIDIA NIM. Strict
   JSON schema per scene.
3. **Scraper Workers** – Wikipedia / Wikidata, Wikimedia Commons, Internet
   Archive, Pexels, Pixabay; Flux 1-dev for abstract visuals.
4. **Character Cinematics** – ElevenLabs narration + word-level timings,
   Wan 2.1 stills→motion, LivePortrait lip-sync, DeepVideo-V1 neural rendering.
5. **Assembly** – Remotion + Motion.dev (Framer Motion) with Mapbox/Leaflet
   sequences, FFmpeg audio-ducking (-85% during VO), burn-in subtitles, 21:9
   cinematic output.

## Quick start

```bash
cp .env.example .env             # populate all credentials
docker compose -f infra/docker-compose.yml up --build
```

| Service        | URL                          |
|----------------|------------------------------|
| Frontend       | http://localhost:3000        |
| FastAPI        | http://localhost:8000/docs   |
| Remotion Studio| http://localhost:3001        |

## Environment variables

All secrets are documented in [`.env.example`](./.env.example). The minimum set
for a full end-to-end render is:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`
- `NVIDIA_NIM_API_KEY`
- `ELEVENLABS_API_KEY`
- `PEXELS_API_KEY`, `PIXABAY_API_KEY`
- `MAPBOX_TOKEN`

## License

Proprietary – © 2026 DocuGen AI.
