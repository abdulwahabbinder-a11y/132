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
  echo "ERROR: Stack $STACK not found or missing outputs. Deploy template.yaml first."
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "==> Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "==> Building API Lambda image..."
docker build -f "${ROOT}/backend/Dockerfile.lambda-api" -t "${API_REPO}:latest" "${ROOT}"
docker push "${API_REPO}:latest"

echo "==> Building Worker Lambda image (FFmpeg + Remotion)..."
docker build -f "${ROOT}/backend/Dockerfile.lambda-worker" -t "${WORKER_REPO}:latest" "${ROOT}"
docker push "${WORKER_REPO}:latest"

echo ""
echo "==> Images pushed. Update stack DeploymentPhase to 'full' if not already:"
echo "    aws cloudformation update-stack --stack-name $STACK --use-previous-template \\"
echo "      --parameters ParameterKey=DeploymentPhase,ParameterValue=full ... (keep other params)"
echo ""
echo "Or update Lambda functions directly:"
API_FN=$(aws cloudformation describe-stack-resources --stack-name "$STACK" --region "$REGION" \
  --logical-resource-id ApiFunction --query 'StackResources[0].PhysicalResourceId' --output text 2>/dev/null || echo "")
if [[ -n "$API_FN" && "$API_FN" != "None" ]]; then
  aws lambda update-function-code --function-name "$API_FN" --image-uri "${API_REPO}:latest" --region "$REGION"
  WORKER_FN=$(aws cloudformation describe-stack-resources --stack-name "$STACK" --region "$REGION" \
    --logical-resource-id WorkerFunction --query 'StackResources[0].PhysicalResourceId' --output text)
  aws lambda update-function-code --function-name "$WORKER_FN" --image-uri "${WORKER_REPO}:latest" --region "$REGION"
  echo "==> Lambda functions updated."
fi
