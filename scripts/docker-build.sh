#!/usr/bin/env bash
# Build frontend + backend Docker images for Google Cloud / local testing
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${DOMAIN:-docuforge.pro}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}"
SUPABASE_ANON="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder}"

echo "==> Building backend image..."
docker build -t docuforge-api:latest "$ROOT/backend"

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
echo "Push to Google Cloud:"
echo "  export PROJECT_ID=your-project REGION=us-central1"
echo "  docker tag docuforge-api:latest \${REGION}-docker.pkg.dev/\${PROJECT_ID}/docuforge/backend:latest"
echo "  docker tag docuforge-frontend:latest \${REGION}-docker.pkg.dev/\${PROJECT_ID}/docuforge/frontend:latest"
echo "  docker push \${REGION}-docker.pkg.dev/\${PROJECT_ID}/docuforge/backend:latest"
echo "  docker push \${REGION}-docker.pkg.dev/\${PROJECT_ID}/docuforge/frontend:latest"
