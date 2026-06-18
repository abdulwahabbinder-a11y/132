#!/usr/bin/env bash
# DocuForge — one-time GCP setup + deploy to Cloud Run
# Usage: ./deploy/gcp/deploy.sh YOUR_GCP_PROJECT_ID
set -euo pipefail

PROJECT_ID="${1:-}"
REGION="${GCP_REGION:-us-central1}"
REPO="docuforge"
DOMAIN="${DOMAIN:-docuforge.pro}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: $0 <GCP_PROJECT_ID>"
  echo "Example: $0 docuforge-prod-123456"
  exit 1
fi

echo "==> Project: $PROJECT_ID | Region: $REGION | Domain: $DOMAIN"

gcloud config set project "$PROJECT_ID"

echo "==> Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  vpcaccess.googleapis.com \
  redis.googleapis.com \
  compute.googleapis.com

echo "==> Creating Artifact Registry repository..."
gcloud artifacts repositories describe "$REPO" --location="$REGION" 2>/dev/null || \
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="DocuForge container images"

echo "==> Granting Cloud Build access to deploy Cloud Run..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin" --quiet 2>/dev/null || true
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" --quiet 2>/dev/null || true

echo ""
echo "==> IMPORTANT: Create secrets in Secret Manager before first deploy."
echo "    See deploy/gcp/DEPLOY.md for the full list."
echo ""
read -r -p "Have you created all secrets? (y/N) " CONFIRM
if [[ "${CONFIRM,,}" != "y" ]]; then
  echo "Aborting. Create secrets first, then re-run."
  exit 1
fi

echo "==> Submitting Cloud Build..."
gcloud builds submit . \
  --config=deploy/gcp/cloudbuild-simple.yaml \
  --substitutions="_REGION=$REGION,_DOMAIN=$DOMAIN"

echo ""
echo "==> Deploy complete. Map your custom domain:"
echo ""
API_URL=$(gcloud run services describe docuforge-api --region="$REGION" --format='value(status.url)' 2>/dev/null || echo "(pending)")
WEB_URL=$(gcloud run services describe docuforge-frontend --region="$REGION" --format='value(status.url)' 2>/dev/null || echo "(pending)")
echo "  API (temp):      $API_URL"
echo "  Frontend (temp): $WEB_URL"
echo ""
echo "  Map domain:"
echo "    gcloud run domain-mappings create --service docuforge-frontend --domain $DOMAIN --region $REGION"
echo "    gcloud run domain-mappings create --service docuforge-api --domain api.$DOMAIN --region $REGION"
echo ""
echo "  Then add DNS records shown by gcloud at your domain registrar."
