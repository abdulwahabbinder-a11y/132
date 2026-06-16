# ChronicleAI Documentary Studio

Subscription-based AI Documentary Video Generator SaaS scaffold using:

- **Frontend:** Next.js, React, Tailwind CSS, Supabase Auth, Stripe pricing links
- **Backend:** FastAPI, Supabase/PostgreSQL, Stripe webhooks, NVIDIA NIM, ElevenLabs, public media APIs
- **Rendering:** Remotion.dev, Motion-style transition presets, Mapbox static maps, FFmpeg finishing
- **AI/video pipeline:** Llama 3.1, Qwen 2.5, Flux, AnyFlow-Wan2.1, LivePortrait, DeepVideo-V1

## Repository layout

```text
apps/
  web/                 Next.js SaaS dashboard and pricing page
  remotion/            21:9 documentary composition and scene renderer
backend/
  app/
    main.py            FastAPI routes: /api/generate-story and /api/webhooks/stripe
    db/                Supabase Auth/PostgREST adapter
    services/          NIM, public media, ElevenLabs, video, and render adapters
    workers/           Background documentary generation pipeline
infra/supabase/        SQL schema, RLS policies, and credit decrement RPC
assets/audio/          Optional music and transition SFX inputs
```

## Required services

Copy `.env.example` to `.env` and fill in:

- Supabase project URL, anon key, and service-role key
- Stripe secret key, webhook secret, and checkout/payment links
- NVIDIA NIM API key and model names
- ElevenLabs API key and voice ID
- Pexels, Pixabay, Mapbox, and optional LivePortrait endpoint

Apply `infra/supabase/schema.sql` to your Supabase project before calling the API.

## Development

```bash
npm install
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
npm run dev:web
backend/.venv/bin/uvicorn app.main:app --app-dir backend --reload
```

## Core API behavior

### `POST /api/webhooks/stripe`

Verifies the Stripe signature and handles `customer.subscription.created`. The webhook resets the matching Supabase subscription to:

- `plan_type = pro`
- `video_credits_left = 30`
- `stripe_customer_id = <Stripe customer>`
- `billing_cycle_end = <Stripe current_period_end>`

If the Stripe subscription metadata includes `supabase_user_id`, the subscription row is upserted for that user.

### `POST /api/generate-story`

Requires a Supabase bearer token. The route:

1. Ensures the user profile exists.
2. Checks `subscriptions.video_credits_left > 0`.
3. Routes English scripts to `meta/llama-3.1-70b-instruct`.
4. Routes Hindi, Urdu, and Roman Urdu scripts to `qwen/qwen-2.5-72b-instruct`.
5. Validates strict chronological JSON scenes containing:
   - `scene_number`
   - `narration_text`
   - `visual_keywords`
   - `is_abstract_scene`
   - `is_historical_character`
   - `character_name`
   - `location_coordinates`
6. Atomically decrements one video credit.
7. Queues the full background generation pipeline.

## Background pipeline

For each scene, the worker:

1. Fetches verifiable timeline context from Wikipedia and Wikidata.
2. Searches/downloads archival media from Wikimedia Commons and Internet Archive for non-abstract scenes.
3. Searches/downloads B-roll from Pexels and Pixabay.
4. Calls Flux through NVIDIA NIM for abstract photorealistic scenes.
5. Synthesizes ElevenLabs MP3 narration and word-level subtitles.
6. Animates stills through AnyFlow-Wan2.1.
7. For historical characters, calls LivePortrait for lip-sync and DeepVideo-V1 for high-fidelity neural rendering.
8. Renders Remotion scenes with Motion-style transitions, map overlays, and center-bottom subtitles.
9. Runs FFmpeg finishing for 21:9 MP4 output, narration-aware music ducking, and optional transition SFX.

## Stripe pricing

`apps/web/components/PricingSection.tsx` includes:

- Free Plan (`$0`)
- Pro Plan (`$29/month`)

Both cards link to the Stripe URLs configured in environment variables.

## Deployment notes

The included Docker API image contains Python, Node, Remotion, and FFmpeg because rendering is orchestrated from the backend worker. For higher throughput, split the worker into a dedicated queue consumer and place generated media in object storage.
