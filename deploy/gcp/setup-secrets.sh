#!/usr/bin/env bash
# Create all required Secret Manager entries for DocuForge on GCP.
# Usage: ./deploy/gcp/setup-secrets.sh YOUR_GCP_PROJECT_ID
# Fill in deploy/gcp/env.gcp.example first, then paste values when prompted.
set -euo pipefail

PROJECT_ID="${1:-}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: $0 <GCP_PROJECT_ID>"
  exit 1
fi

gcloud config set project "$PROJECT_ID"

create_secret() {
  local name="$1"
  local prompt="$2"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "  [skip] $name already exists"
    return
  fi
  read -r -p "$prompt: " value
  [[ -n "$value" ]] || { echo "  [skip] empty value for $name"; return; }
  printf '%s' "$value" | gcloud secrets create "$name" --data-file=- --replication-policy=automatic
  echo "  [ok] $name created"
}

echo "==> Creating DocuForge secrets in project $PROJECT_ID"
echo "    (Press Enter to skip optional secrets)"

create_secret "docuforge-supabase-url" "SUPABASE_URL"
create_secret "docuforge-supabase-anon-key" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
create_secret "docuforge-supabase-service-key" "SUPABASE_SERVICE_KEY"
create_secret "docuforge-supabase-jwt" "SUPABASE_JWT_SECRET"
create_secret "docuforge-redis-url" "REDIS_URL (Upstash: rediss://... or Memorystore: redis://10.x.x.x:6379/0)"
create_secret "docuforge-stripe-secret" "STRIPE_SECRET_KEY"
create_secret "docuforge-stripe-webhook" "STRIPE_WEBHOOK_SECRET"
create_secret "docuforge-stripe-price" "STRIPE_PRO_PRICE_ID"
create_secret "docuforge-nvidia-nim" "NVIDIA_NIM_API_KEY"
create_secret "docuforge-elevenlabs" "ELEVENLABS_API_KEY"
create_secret "docuforge-claude" "CLAUDE_API_KEY"
create_secret "docuforge-tavily" "TAVILY_API_KEY"
create_secret "docuforge-jina" "JINA_API_KEY"

echo ""
echo "==> Grant Cloud Run access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for secret in docuforge-supabase-url docuforge-supabase-anon-key docuforge-supabase-service-key \
  docuforge-supabase-jwt docuforge-redis-url docuforge-stripe-secret docuforge-stripe-webhook \
  docuforge-stripe-price docuforge-nvidia-nim docuforge-elevenlabs docuforge-claude \
  docuforge-tavily docuforge-jina; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${RUN_SA}" \
    --role="roles/secretmanager.secretAccessor" --quiet 2>/dev/null || true
done

echo "==> Done. Run: bash deploy/gcp/deploy.sh $PROJECT_ID"
