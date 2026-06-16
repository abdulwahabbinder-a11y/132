# Docker Guide — DocuForge (AWS / GCP / local)

Production Dockerfiles for **frontend** (Next.js) and **backend** (FastAPI + Celery worker).

## Files

| File | Purpose |
|------|---------|
| `frontend/Dockerfile` | Next.js standalone — optimized for ECS/Cloud Run (~150MB) |
| `backend/Dockerfile` | FastAPI + FFmpeg + Remotion (Node 20) — port 8080 |
| `backend/worker_entrypoint.sh` | Celery worker with HTTP health check for Fargate/Cloud Run |
| `docker-compose.prod.yml` | Test full stack locally before deploy |
| `scripts/docker-build.sh` | One-command image build |

## Deploy guides

| Platform | Guide |
|----------|-------|
| **AWS ECS Fargate** | [deploy/aws/DEPLOY.md](aws/DEPLOY.md) |
| Google Cloud Run | [deploy/gcp/DEPLOY.md](gcp/DEPLOY.md) |

---

## Quick start (local test)

```bash
# 1. Copy env file
cp .env.example .env
# Fill in Supabase keys, etc.

# 2. Build & run all services
docker compose -f docker-compose.prod.yml up --build

# Open:
#   Frontend → http://localhost:3000
#   API      → http://localhost:8080/health
#   API docs → http://localhost:8080/docs
```

---

## Build images manually

### Backend (includes Remotion renderer)
```bash
docker build -f backend/Dockerfile -t docuforge-api .
docker run -p 8080:8080 --env-file .env docuforge-api
```

### Frontend
```bash
docker build -t docuforge-frontend ./frontend \
  --build-arg NEXT_PUBLIC_SITE_URL=https://docuforge.pro \
  --build-arg NEXT_PUBLIC_API_URL=https://api.docuforge.pro/api \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

docker run -p 8080:8080 docuforge-frontend
```

> **Important:** `NEXT_PUBLIC_*` variables must be set at **build time** for Next.js. Changing them requires rebuilding the frontend image.

### Worker (same backend image)
```bash
docker run --env-file .env docuforge-api ./worker_entrypoint.sh
```

---

## Deploy to Google Cloud Run

### Option A — Automated (recommended)
```bash
bash deploy/gcp/setup-secrets.sh YOUR_PROJECT_ID
bash deploy/gcp/deploy.sh YOUR_PROJECT_ID
bash deploy/gcp/setup-domain.sh YOUR_PROJECT_ID docuforge.pro
```

### Option B — Manual push

```bash
export PROJECT_ID=your-gcp-project
export REGION=us-central1

# Enable APIs & create registry
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
gcloud artifacts repositories create docuforge \
  --repository-format=docker --location=$REGION

# Configure Docker auth
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build & push
bash scripts/docker-build.sh

docker tag docuforge-api:latest \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/docuforge/backend:latest
docker tag docuforge-frontend:latest \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/docuforge/frontend:latest

docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docuforge/backend:latest
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/docuforge/frontend:latest

# Deploy API
gcloud run deploy docuforge-api \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/docuforge/backend:latest \
  --region $REGION --port 8080 --allow-unauthenticated \
  --memory 2Gi --set-env-vars FRONTEND_URL=https://docuforge.pro

# Deploy Frontend
gcloud run deploy docuforge-frontend \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/docuforge/frontend:latest \
  --region $REGION --port 8080 --allow-unauthenticated

# Deploy Worker
gcloud run deploy docuforge-worker \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/docuforge/backend:latest \
  --region $REGION --port 8080 --no-allow-unauthenticated \
  --command ./worker_entrypoint.sh \
  --memory 4Gi --timeout 3600 --min-instances 1 --no-cpu-throttling
```

---

## Cloud Run settings

| Service | Port | Memory | Timeout | Notes |
|---------|------|--------|---------|-------|
| `docuforge-frontend` | 8080 | 1Gi | 60s | Public |
| `docuforge-api` | 8080 | 2Gi | 300s | Public |
| `docuforge-worker` | 8080 | 4Gi | 3600s | Private, min 1 instance |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend shows wrong API URL | Rebuild with correct `NEXT_PUBLIC_API_URL` build-arg |
| `public` folder missing error | `mkdir -p frontend/public` (empty folder is fine) |
| Worker crashes on Cloud Run | Use `./worker_entrypoint.sh` (includes health HTTP server) |
| FFmpeg not found | Backend image includes FFmpeg — don't use alpine Python base |

Full GCP guide: [deploy/gcp/DEPLOY.md](deploy/gcp/DEPLOY.md)
