#!/usr/bin/env bash
# Build frontend + backend Docker images for AWS ECR / GCP / local testing
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${DOMAIN:-docuforge.pro}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}"
SUPABASE_ANON="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder}"

echo "==> Building backend image (API + Remotion)..."
docker build -f backend/Dockerfile -t docuforge-api:latest "$ROOT"

echo "==> Building frontend image..."
docker build -t docuforge-frontend:latest "$ROOT/frontend" \
  --build-arg "NEXT_PUBLIC_SITE_URL=https://${DOMAIN}" \
  --build-arg "NEXT_PUBLIC_API_URL=https://api.${DOMAIN}/api" \
  --build-arg "NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}" \
  --build-arg "NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON}"

echo ""
echo "==> Done!"
echo "  Backend:  docuforge-api:latest"
echo "  Frontend: docuforge-frontend:latest"
echo ""
echo "Test locally:"
echo "  docker compose -f docker-compose.prod.yml up --build"
echo ""
echo "Deploy to AWS:"
echo "  bash deploy/aws/setup-secrets.sh"
echo "  bash deploy/aws/setup-infrastructure.sh"
echo "  bash deploy/aws/deploy.sh"
echo ""
echo "Deploy to Google Cloud:"
echo "  bash deploy/gcp/setup-secrets.sh YOUR_PROJECT_ID"
echo "  bash deploy/gcp/deploy.sh YOUR_PROJECT_ID"
