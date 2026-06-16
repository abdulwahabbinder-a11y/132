# AI Documentary Backend

FastAPI service that powers:

- subscription-aware story generation (`/api/generate-story`)
- Stripe webhooks (`/api/webhooks/stripe`)
- async scene processing pipeline for scraping, media fetching, narration, and render orchestration
