#!/usr/bin/env bash
# Build Next.js frontend and upload to S3 + invalidate CloudFront
# Usage: bash deploy/aws/upload-frontend.sh <stack-name> [region]
set -euo pipefail

STACK="${1:-docuforge-serverless}"
REGION="${2:-${AWS_REGION:-us-east-1}}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
CF_DOMAIN=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" --output text)
DOMAIN=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Parameters[?ParameterKey=='DomainName'].ParameterValue" --output text 2>/dev/null || echo "docuforge.pro")

SUPABASE_URL=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Parameters[?ParameterKey=='SupabaseUrl'].ParameterValue" --output text 2>/dev/null || echo "")
SUPABASE_ANON=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Parameters[?ParameterKey=='SupabaseAnonKey'].ParameterValue" --output text 2>/dev/null || echo "")

API_URL="${CF_DOMAIN}/api"

echo "==> Building Next.js frontend..."
cd "${ROOT}/frontend"
export NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"
export NEXT_PUBLIC_API_URL="${API_URL}"
export NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON}"
npm ci
npm run build

echo "==> Uploading standalone build to S3..."
# Next.js standalone: copy static assets into standalone folder
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

# For static hosting we upload a simple approach: use standalone server via Lambda in future
# For now upload public + static chunks for SPA shell
aws s3 sync public/ "s3://${BUCKET}/" --delete --region "$REGION" 2>/dev/null || true
aws s3 sync .next/static "s3://${BUCKET}/_next/static" --region "$REGION"

DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='${CF_DOMAIN#https://}'].Id" --output text --region "$REGION" 2>/dev/null || echo "")
if [[ -n "$DIST_ID" && "$DIST_ID" != "None" ]]; then
  aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*" --region "$REGION"
fi

echo "==> Frontend uploaded to s3://${BUCKET}"
echo "    URL: ${CF_DOMAIN}"
