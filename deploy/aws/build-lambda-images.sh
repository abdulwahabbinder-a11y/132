#!/usr/bin/env bash
# Build Lambda container images and push to ECR after CloudFormation stack creation
# Usage: bash deploy/aws/build-lambda-images.sh <stack-name> [region]
set -euo pipefail

STACK="${1:-docuforge-serverless}"
REGION="${2:-${AWS_REGION:-us-east-1}}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

API_REPO=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEcrRepositoryUri'].OutputValue" --output text)
WORKER_REPO=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WorkerEcrRepositoryUri'].OutputValue" --output text)

if [[ -z "$API_REPO" || "$API_REPO" == "None" ]]; then
  echo "ERROR: Stack $STACK not found or missing outputs. Deploy template.yaml first (DeploymentPhase=infrastructure)."
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "==> Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "==> Building API Lambda image..."
docker build -f "${ROOT}/backend/Dockerfile.lambda-api" -t "${API_REPO}:latest" "${ROOT}"
docker push "${API_REPO}:latest"

echo "==> Building Worker Lambda image (FFmpeg + Remotion — may take 15+ min)..."
docker build -f "${ROOT}/backend/Dockerfile.lambda-worker" -t "${WORKER_REPO}:latest" "${ROOT}"
docker push "${WORKER_REPO}:latest"

verify_image() {
  local repo_uri="$1"
  local repo_name="${repo_uri#${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/}"
  aws ecr describe-images \
    --repository-name "$repo_name" \
    --region "$REGION" \
    --image-ids imageTag=latest \
    --query 'imageDetails[0].imageTags' \
    --output text >/dev/null
}

echo "==> Verifying images in ECR..."
verify_image "$API_REPO"
verify_image "$WORKER_REPO"
echo "==> Both :latest images confirmed in ECR."

API_FN=$(aws cloudformation describe-stack-resources --stack-name "$STACK" --region "$REGION" \
  --logical-resource-id ApiFunction --query 'StackResources[0].PhysicalResourceId' --output text 2>/dev/null || echo "")
if [[ -n "$API_FN" && "$API_FN" != "None" ]]; then
  echo "==> Updating existing Lambda functions..."
  aws lambda update-function-code --function-name "$API_FN" --image-uri "${API_REPO}:latest" --region "$REGION"
  WORKER_FN=$(aws cloudformation describe-stack-resources --stack-name "$STACK" --region "$REGION" \
    --logical-resource-id WorkerFunction --query 'StackResources[0].PhysicalResourceId' --output text)
  aws lambda update-function-code --function-name "$WORKER_FN" --image-uri "${WORKER_REPO}:latest" --region "$REGION"
  echo "==> Lambda functions updated."
else
  echo ""
  echo "==> Images ready. Set DeploymentPhase=full in CloudFormation (or run deploy-serverless.sh)."
fi
