#!/usr/bin/env bash
# Map docuforge.pro and api.docuforge.pro to Cloud Run services
set -euo pipefail

PROJECT_ID="${1:-}"
DOMAIN="${2:-docuforge.pro}"
REGION="${3:-us-central1}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: $0 <GCP_PROJECT_ID> [domain] [region]"
  exit 1
fi

gcloud config set project "$PROJECT_ID"

echo "==> Mapping $DOMAIN → docuforge-frontend"
gcloud beta run domain-mappings create \
  --service docuforge-frontend \
  --domain "$DOMAIN" \
  --region "$REGION" 2>/dev/null || \
  echo "  (mapping may already exist)"

echo "==> Mapping api.$DOMAIN → docuforge-api"
gcloud beta run domain-mappings create \
  --service docuforge-api \
  --domain "api.$DOMAIN" \
  --region "$REGION" 2>/dev/null || \
  echo "  (mapping may already exist)"

echo ""
echo "==> DNS records to add at your domain registrar:"
echo ""
gcloud beta run domain-mappings describe --domain "$DOMAIN" --region "$REGION" 2>/dev/null || true
echo ""
gcloud beta run domain-mappings describe --domain "api.$DOMAIN" --region "$REGION" 2>/dev/null || true
echo ""
echo "After DNS propagates (up to 48h), your site will be live at:"
echo "  https://$DOMAIN"
echo "  https://api.$DOMAIN"
