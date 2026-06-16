#!/usr/bin/env bash
# Create DocuForge secrets in AWS Secrets Manager
# Usage: bash deploy/aws/setup-secrets.sh [AWS_REGION]
set -euo pipefail

REGION="${1:-${AWS_REGION:-us-east-1}}"
PREFIX="docuforge"

put_secret() {
  local name="$1"
  local value="$2"
  local id="${PREFIX}/${name}"

  if aws secretsmanager describe-secret --secret-id "$id" --region "$REGION" >/dev/null 2>&1; then
    echo "  Updating ${id}"
    aws secretsmanager put-secret-value \
      --secret-id "$id" \
      --secret-string "$value" \
      --region "$REGION" >/dev/null
  else
    echo "  Creating ${id}"
    aws secretsmanager create-secret \
      --name "$id" \
      --secret-string "$value" \
      --region "$REGION" >/dev/null
  fi
}

echo "==> DocuForge AWS Secrets Manager setup (region: ${REGION})"
echo "    Paste values when prompted. Press Enter to skip optional keys."
echo ""

read -rsp "SUPABASE_URL: " SUPABASE_URL; echo
read -rsp "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY; echo
read -rsp "SUPABASE_JWT_SECRET: " SUPABASE_JWT_SECRET; echo
read -rsp "NEXT_PUBLIC_SUPABASE_URL: " NEXT_PUBLIC_SUPABASE_URL; echo
read -rsp "NEXT_PUBLIC_SUPABASE_ANON_KEY: " NEXT_PUBLIC_SUPABASE_ANON_KEY; echo
read -rsp "REDIS_URL: " REDIS_URL; echo
read -rsp "STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY; echo
read -rsp "STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET; echo
read -rsp "STRIPE_PRO_PRICE_ID: " STRIPE_PRO_PRICE_ID; echo
read -rsp "NVIDIA_NIM_API_KEY (optional): " NVIDIA_NIM_API_KEY; echo
read -rsp "ELEVENLABS_API_KEY (optional): " ELEVENLABS_API_KEY; echo
read -rsp "CLAUDE_API_KEY (optional): " CLAUDE_API_KEY; echo
read -rsp "TAVILY_API_KEY (optional): " TAVILY_API_KEY; echo
read -rsp "JINA_API_KEY (optional): " JINA_API_KEY; echo

[[ -n "$SUPABASE_URL" ]] && put_secret "supabase-url" "$SUPABASE_URL"
[[ -n "$SUPABASE_SERVICE_KEY" ]] && put_secret "supabase-service-key" "$SUPABASE_SERVICE_KEY"
[[ -n "$SUPABASE_JWT_SECRET" ]] && put_secret "supabase-jwt" "$SUPABASE_JWT_SECRET"
[[ -n "$NEXT_PUBLIC_SUPABASE_URL" ]] && put_secret "supabase-public-url" "$NEXT_PUBLIC_SUPABASE_URL"
[[ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]] && put_secret "supabase-anon-key" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
[[ -n "$REDIS_URL" ]] && put_secret "redis-url" "$REDIS_URL"
[[ -n "$STRIPE_SECRET_KEY" ]] && put_secret "stripe-secret" "$STRIPE_SECRET_KEY"
[[ -n "$STRIPE_WEBHOOK_SECRET" ]] && put_secret "stripe-webhook" "$STRIPE_WEBHOOK_SECRET"
[[ -n "$STRIPE_PRO_PRICE_ID" ]] && put_secret "stripe-price" "$STRIPE_PRO_PRICE_ID"
[[ -n "$NVIDIA_NIM_API_KEY" ]] && put_secret "nvidia-nim" "$NVIDIA_NIM_API_KEY"
[[ -n "$ELEVENLABS_API_KEY" ]] && put_secret "elevenlabs" "$ELEVENLABS_API_KEY"
[[ -n "$CLAUDE_API_KEY" ]] && put_secret "claude" "$CLAUDE_API_KEY"
[[ -n "$TAVILY_API_KEY" ]] && put_secret "tavily" "$TAVILY_API_KEY"
[[ -n "$JINA_API_KEY" ]] && put_secret "jina" "$JINA_API_KEY"

echo ""
echo "==> Done. Next steps:"
echo "    1. bash deploy/aws/setup-infrastructure.sh"
echo "    2. bash deploy/aws/deploy.sh"
