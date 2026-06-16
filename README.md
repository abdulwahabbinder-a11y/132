# AI Documentary Video Generator SaaS

Production-ready scaffold for a subscription-based documentary video generator using:

- **Frontend:** Next.js App Router, React, Tailwind CSS
- **Backend:** FastAPI, Supabase/PostgreSQL, Stripe webhooks
- **AI/Media:** NVIDIA NIM (Llama 3.1, Qwen 2.5, Flux, Wan2.1), ElevenLabs, Wikimedia, Internet Archive, Pexels, Pixabay
- **Video:** Remotion, Motion.dev, FFmpeg, Mapbox/Leaflet-ready map sequences

## Repository layout

```text
apps/
  api/        FastAPI application, provider clients, background pipeline
  web/        Next.js SaaS dashboard and pricing UI
packages/
  remotion/   Remotion documentary composition and render entrypoint
docs/
  architecture.md
```

## Quick start

1. Copy `.env.example` into each runtime environment and populate secrets.
2. Install JavaScript packages:
   ```bash
   npm install
   ```
3. Install API dependencies:
   ```bash
   python -m venv .venv
   . .venv/bin/activate
   pip install -r apps/api/requirements.txt
   ```
4. Run the API:
   ```bash
   uvicorn app.main:app --reload --app-dir apps/api
   ```
5. Run the web app:
   ```bash
   npm run dev --workspace apps/web
   ```

## Production notes

- Stripe webhook signature verification is enforced when `STRIPE_WEBHOOK_SECRET` is set.
- Story generation requires credits in Supabase and decrements them after a job is created.
- External provider clients are isolated under `apps/api/app/services` so production credentials can be rotated independently.
- Rendering is delegated to `packages/remotion` and FFmpeg post-processing.
