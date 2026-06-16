# DocuForge on Google Cloud Platform

Deploy **docuforge.pro** on Google Cloud using **Cloud Run** (serverless containers).

## Architecture

```
                    ┌─────────────────────────────────────┐
   docuforge.pro ──►│  Cloud Run: docuforge-frontend      │
                    │  (Next.js landing + app)            │
                    └─────────────────────────────────────┘

              api.docuforge.pro
                    ┌─────────────────────────────────────┐
                    ▼                                     │
              ┌──────────────┐    ┌──────────────────┐   │
              │ Cloud Run    │───►│ Upstash Redis    │   │
              │ docuforge-api│    │ (or Memorystore) │   │
              └──────────────┘    └────────┬─────────┘   │
                    │                      │             │
                    ▼                      ▼             │
              ┌──────────────┐    ┌──────────────────┐   │
              │ Cloud Run    │    │ Supabase (DB)    │   │
              │ docuforge-   │    │ Stripe (billing) │   │
              │ worker       │    └──────────────────┘   │
              │ (Celery+FFmpeg)                           │
              └──────────────┘
```

| Service | GCP Product | URL |
|---------|-------------|-----|
| Landing + App UI | Cloud Run | `https://docuforge.pro` |
| FastAPI Backend | Cloud Run | `https://api.docuforge.pro` |
| Video Worker | Cloud Run | internal only |
| Redis | Upstash (easy) or Memorystore | private |
| Database | Supabase | external |

---

## Prerequisites

1. [Google Cloud account](https://cloud.google.com/) with billing enabled
2. [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed
3. Domain **docuforge.pro** (you already own this)
4. Supabase project + Stripe account

---

## Step 1 — Create GCP Project

```bash
export PROJECT_ID=docuforge-prod-123456   # pick a unique ID
export REGION=us-central1

gcloud projects create $PROJECT_ID --name="DocuForge"
gcloud config set project $PROJECT_ID
gcloud billing accounts list   # note your BILLING_ACCOUNT_ID
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

---

## Step 2 — Redis (choose one)

### Option A — Upstash (recommended, fastest setup)

1. Create a free Redis database at [upstash.com](https://upstash.com)
2. Copy the **Redis URL** (starts with `rediss://`)
3. Use this as `REDIS_URL` in secrets (Step 3)

### Option B — Memorystore (GCP native, needs VPC)

```bash
gcloud compute networks create docuforge-vpc --subnet-mode=auto

gcloud redis instances create docuforge-redis \
  --size=1 --region=$REGION --network=docuforge-vpc

gcloud compute networks vpc-access connectors create docuforge-connector \
  --region=$REGION --network=docuforge-vpc --range=10.8.0.0/28

# Use cloudbuild.yaml (with VPC) instead of cloudbuild-simple.yaml
```

---

## Step 3 — Store secrets

```bash
chmod +x deploy/gcp/setup-secrets.sh deploy/gcp/deploy.sh deploy/gcp/setup-domain.sh
bash deploy/gcp/setup-secrets.sh $PROJECT_ID
```

Required secrets:

| Secret name | Value |
|-------------|-------|
| `docuforge-supabase-url` | `https://xxx.supabase.co` |
| `docuforge-supabase-anon-key` | Supabase anon key |
| `docuforge-supabase-service-key` | Supabase service role key |
| `docuforge-supabase-jwt` | Supabase JWT secret |
| `docuforge-redis-url` | Upstash `rediss://...` URL |
| `docuforge-stripe-secret` | `sk_live_...` |
| `docuforge-stripe-webhook` | `whsec_...` |
| `docuforge-stripe-price` | `price_...` |
| `docuforge-nvidia-nim` | NVIDIA API key |
| `docuforge-elevenlabs` | ElevenLabs key |
| `docuforge-claude` | Claude API key |
| `docuforge-tavily` | Tavily key |
| `docuforge-jina` | Jina key |

---

## Step 4 — Deploy to Cloud Run

```bash
bash deploy/gcp/deploy.sh $PROJECT_ID
```

This builds Docker images, pushes to Artifact Registry, and deploys:
- `docuforge-frontend` — Next.js on port 8080
- `docuforge-api` — FastAPI on port 8080
- `docuforge-worker` — Celery + FFmpeg (min 1 instance)

**Estimated monthly cost (light usage):** ~$30–80 (Cloud Run + worker always-on)

---

## Step 5 — Connect docuforge.pro domain

```bash
bash deploy/gcp/setup-domain.sh $PROJECT_ID docuforge.pro $REGION
```

This maps:
- `docuforge.pro` → frontend Cloud Run service
- `api.docuforge.pro` → API Cloud Run service

### DNS records (at your domain registrar)

After running `setup-domain.sh`, add the DNS records shown by `gcloud`. Typically:

| Type | Name | Value |
|------|------|-------|
| CNAME | `@` or `docuforge.pro` | `ghs.googlehosted.com` (gcloud shows exact value) |
| CNAME | `api` | `ghs.googlehosted.com` (gcloud shows exact value) |

> Google Cloud Run domain mapping may require domain verification in [Google Search Console](https://search.google.com/search-console).

---

## Step 6 — Stripe webhook

In Stripe Dashboard → Webhooks → Add endpoint:

```
https://api.docuforge.pro/api/webhooks/stripe
```

Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`

---

## Step 7 — Email (support@docuforge.pro)

Configure MX records at your domain registrar:

| Provider | Setup |
|----------|-------|
| Google Workspace | Add MX records from Google Admin |
| Zoho Mail | Free tier for custom domain |
| Cloudflare Email Routing | Forward to Gmail (free) |

---

## Re-deploy after code changes

```bash
gcloud builds submit . \
  --config=deploy/gcp/cloudbuild-simple.yaml \
  --substitutions="_REGION=$REGION,_DOMAIN=docuforge.pro"
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Landing page blank | Rebuild frontend — `NEXT_PUBLIC_*` vars are baked at build time |
| API CORS error | Check `CORS_ORIGINS` includes `https://docuforge.pro` |
| Worker not processing | Check `REDIS_URL` secret; worker needs `--min-instances=1` |
| Video files lost | Cloud Run `/tmp` is ephemeral — add GCS bucket (future upgrade) |
| Domain not verifying | Verify domain ownership in Google Search Console |

---

## Manual test URLs (before custom domain)

```bash
gcloud run services describe docuforge-frontend --region=$REGION --format='value(status.url)'
gcloud run services describe docuforge-api --region=$REGION --format='value(status.url)'
```

---

## Files reference

```
deploy/gcp/
├── DEPLOY.md              ← this guide
├── cloudbuild-simple.yaml ← deploy without VPC (Upstash Redis)
├── cloudbuild.yaml        ← deploy with VPC connector (Memorystore)
├── deploy.sh              ← one-command deploy
├── setup-secrets.sh       ← create Secret Manager entries
├── setup-domain.sh        ← map docuforge.pro to Cloud Run
└── env.gcp.example        ← environment variable reference
```
