#!/usr/bin/env bash
# One-command DocuForge serverless deploy (fixes ECR chicken-and-egg).
# Usage: bash deploy/aws/deploy-serverless.sh [stack-name] [region]
#
# Flow:
#   1. Create/update stack with DeploymentPhase=infrastructure (ECR, SQS, CloudFront — no Lambdas)
#   2. Build & push API + Worker Docker images to ECR
#   3. Update stack to DeploymentPhase=full (creates Lambdas — images now exist)
set -euo pipefail

STACK="${1:-docuforge-serverless}"
REGION="${2:-${AWS_REGION:-us-east-1}}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE="${ROOT}/deploy/aws/template.yaml"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "ERROR: template not found at $TEMPLATE"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required. Start Docker Desktop and retry."
  exit 1
fi

if ! aws sts get-caller-identity --region "$REGION" >/dev/null 2>&1; then
  echo "ERROR: AWS CLI not configured. Run: aws configure"
  exit 1
fi

echo "==> DocuForge serverless deploy"
echo "    Stack:  $STACK"
echo "    Region: $REGION"
echo ""

# Collect parameters (interactive on first create, reuse on update)
PARAMS_FILE="$(mktemp)"
trap 'rm -f "$PARAMS_FILE"' EXIT

if aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" >/dev/null 2>&1; then
  echo "==> Loading existing stack parameters..."
  aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
    --query 'Stacks[0].Parameters[*].[ParameterKey,ParameterValue]' \
    --output text | while read -r key value; do
      echo "ParameterKey=${key},ParameterValue=${value}" >> "$PARAMS_FILE"
    done
else
  echo "==> First deploy — enter stack parameters:"
  read -rp "Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
  read -rsp "Supabase Anon Key: " SUPABASE_ANON; echo
  read -rsp "Supabase Service Role Key: " SUPABASE_SERVICE; echo
  read -rsp "Supabase JWT Secret: " SUPABASE_JWT; echo
  read -rsp "Stripe Secret Key: " STRIPE_SECRET; echo
  read -rsp "ElevenLabs API Key (optional): " ELEVENLABS; echo
  read -rsp "Stripe Webhook Secret (optional): " STRIPE_WEBHOOK; echo
  read -rp "Domain name [docuforge.pro]: " DOMAIN
  DOMAIN="${DOMAIN:-docuforge.pro}"

  {
    echo "ParameterKey=SupabaseUrl,ParameterValue=${SUPABASE_URL}"
    echo "ParameterKey=SupabaseAnonKey,ParameterValue=${SUPABASE_ANON}"
    echo "ParameterKey=SupabaseServiceKey,ParameterValue=${SUPABASE_SERVICE}"
    echo "ParameterKey=SupabaseJwtSecret,ParameterValue=${SUPABASE_JWT}"
    echo "ParameterKey=StripeSecretKey,ParameterValue=${STRIPE_SECRET}"
    echo "ParameterKey=ElevenLabsApiKey,ParameterValue=${ELEVENLABS}"
    echo "ParameterKey=StripeWebhookSecret,ParameterValue=${STRIPE_WEBHOOK}"
    echo "ParameterKey=DomainName,ParameterValue=${DOMAIN}"
    echo "ParameterKey=DeploymentPhase,ParameterValue=infrastructure"
  } > "$PARAMS_FILE"
fi

# Force infrastructure phase for step 1
grep -v '^ParameterKey=DeploymentPhase,' "$PARAMS_FILE" > "${PARAMS_FILE}.tmp" || true
mv "${PARAMS_FILE}.tmp" "$PARAMS_FILE"
echo "ParameterKey=DeploymentPhase,ParameterValue=infrastructure" >> "$PARAMS_FILE"

echo "==> Step 1/3: CloudFormation (infrastructure — ECR, no Lambdas yet)..."
aws cloudformation deploy \
  --stack-name "$STACK" \
  --template-file "$TEMPLATE" \
  --parameter-overrides file://"$PARAMS_FILE" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region "$REGION" \
  --no-fail-on-empty-changeset

echo ""
echo "==> Step 2/3: Build & push Lambda images to ECR..."
bash "${ROOT}/deploy/aws/build-lambda-images.sh" "$STACK" "$REGION"

echo ""
echo "==> Step 3/3: Enable Lambda functions (DeploymentPhase=full)..."
grep -v '^ParameterKey=DeploymentPhase,' "$PARAMS_FILE" > "${PARAMS_FILE}.tmp" || true
mv "${PARAMS_FILE}.tmp" "$PARAMS_FILE"
echo "ParameterKey=DeploymentPhase,ParameterValue=full" >> "$PARAMS_FILE"

aws cloudformation deploy \
  --stack-name "$STACK" \
  --template-file "$TEMPLATE" \
  --parameter-overrides file://"$PARAMS_FILE" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region "$REGION" \
  --no-fail-on-empty-changeset

API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiHealthCheck'].OutputValue" --output text)
CF_URL=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" --output text)

echo ""
echo "=========================================="
echo "  DocuForge serverless deploy complete"
echo "=========================================="
echo "  API health:  $API_URL"
echo "  Frontend:    $CF_URL"
echo ""
echo "  Next: bash deploy/aws/upload-frontend.sh $STACK $REGION"
echo "  Stripe webhook: see StripeWebhookUrl in stack Outputs"
echo "=========================================="
