#!/usr/bin/env bash
# Build, push to ECR, register ECS task definitions, and deploy services
# Usage: bash deploy/aws/deploy.sh [image-tag]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TAG="${1:-latest}"
REGION="${AWS_REGION:-us-east-1}"
DOMAIN="${DOMAIN:-docuforge.pro}"
STACK_NAME="${STACK_NAME:-docuforge}"
CLUSTER="${ECS_CLUSTER:-docuforge}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BACKEND="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/docuforge/backend"
ECR_FRONTEND="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/docuforge/frontend"

get_output() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='${1}'].OutputValue" \
    --output text
}

get_secret_arn() {
  aws secretsmanager describe-secret \
    --secret-id "docuforge/${1}" \
    --region "$REGION" \
    --query ARN \
    --output text 2>/dev/null || echo ""
}

secret_ref() {
  local arn="$1"
  if [[ -z "$arn" ]]; then
    echo "MISSING_SECRET"
  else
    echo "${arn}"
  fi
}

render_task_def() {
  local template="$1"
  local output="$2"
  local secret_arns="$3"

  sed \
    -e "s|__EXECUTION_ROLE_ARN__|${EXECUTION_ROLE_ARN}|g" \
    -e "s|__TASK_ROLE_ARN__|${TASK_ROLE_ARN}|g" \
    -e "s|__BACKEND_IMAGE__|${ECR_BACKEND}:${TAG}|g" \
    -e "s|__FRONTEND_IMAGE__|${ECR_FRONTEND}:${TAG}|g" \
    -e "s|__AWS_REGION__|${REGION}|g" \
    -e "s|__FRONTEND_URL__|https://${DOMAIN}|g" \
    -e "s|__CORS_ORIGINS__|https://${DOMAIN},https://www.${DOMAIN}|g" \
    -e "s|__SECRET_ARN_PREFIX__|${secret_arns}|g" \
    "$template" > "$output"
}

echo "==> Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

SUPABASE_URL=$(aws secretsmanager get-secret-value --secret-id docuforge/supabase-public-url --region "$REGION" --query SecretString --output text 2>/dev/null || echo "https://placeholder.supabase.co")
SUPABASE_ANON=$(aws secretsmanager get-secret-value --secret-id docuforge/supabase-anon-key --region "$REGION" --query SecretString --output text 2>/dev/null || echo "placeholder")

echo "==> Building backend image..."
docker build -f "${ROOT}/backend/Dockerfile" -t "docuforge-api:${TAG}" "${ROOT}"
docker tag "docuforge-api:${TAG}" "${ECR_BACKEND}:${TAG}"
docker tag "docuforge-api:${TAG}" "${ECR_BACKEND}:latest"
docker push "${ECR_BACKEND}:${TAG}"
docker push "${ECR_BACKEND}:latest"

echo "==> Building frontend image..."
docker build -t "docuforge-frontend:${TAG}" "${ROOT}/frontend" \
  --build-arg "NEXT_PUBLIC_SITE_URL=https://${DOMAIN}" \
  --build-arg "NEXT_PUBLIC_API_URL=https://api.${DOMAIN}/api" \
  --build-arg "NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}" \
  --build-arg "NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON}"
docker tag "docuforge-frontend:${TAG}" "${ECR_FRONTEND}:${TAG}"
docker tag "docuforge-frontend:${TAG}" "${ECR_FRONTEND}:latest"
docker push "${ECR_FRONTEND}:${TAG}"
docker push "${ECR_FRONTEND}:latest"

EXECUTION_ROLE_ARN=$(get_output TaskExecutionRoleArn)
TASK_ROLE_ARN=$(get_output TaskRoleArn)
API_TG_ARN=$(get_output ApiTargetGroupArn)
FRONTEND_TG_ARN=$(get_output FrontendTargetGroupArn)
ECS_SG=$(get_output EcsSecurityGroupId)
SUBNETS=$(get_output PrivateSubnetIds)

# Build secret ARN prefix — task defs reference individual secrets by full ARN
# We replace __SECRET_ARN_PREFIX__ with base and append :name:: in JSON — fix approach:
# Use full ARN per secret in deploy script

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

build_task_with_secrets() {
  local template="$1"
  local output="$2"
  cp "$template" "$output"
  sed -i \
    -e "s|__EXECUTION_ROLE_ARN__|${EXECUTION_ROLE_ARN}|g" \
    -e "s|__TASK_ROLE_ARN__|${TASK_ROLE_ARN}|g" \
    -e "s|__BACKEND_IMAGE__|${ECR_BACKEND}:${TAG}|g" \
    -e "s|__FRONTEND_IMAGE__|${ECR_FRONTEND}:${TAG}|g" \
    -e "s|__AWS_REGION__|${REGION}|g" \
    -e "s|__FRONTEND_URL__|https://${DOMAIN}|g" \
    -e "s|__CORS_ORIGINS__|https://${DOMAIN},https://www.${DOMAIN}|g" \
    "$output"

  for key in supabase-url supabase-service-key supabase-jwt redis-url stripe-secret stripe-webhook stripe-price nvidia-nim elevenlabs claude tavily jina; do
    arn=$(get_secret_arn "$key")
    if [[ -n "$arn" ]]; then
      sed -i "s|__SECRET_ARN_PREFIX__:${key}::|${arn}|g" "$output"
    fi
  done
}

build_task_with_secrets "${ROOT}/deploy/aws/ecs/task-api.json" "${TMP_DIR}/task-api.json"
build_task_with_secrets "${ROOT}/deploy/aws/ecs/task-worker.json" "${TMP_DIR}/task-worker.json"

cp "${ROOT}/deploy/aws/ecs/task-frontend.json" "${TMP_DIR}/task-frontend.json"
sed -i \
  -e "s|__EXECUTION_ROLE_ARN__|${EXECUTION_ROLE_ARN}|g" \
  -e "s|__TASK_ROLE_ARN__|${TASK_ROLE_ARN}|g" \
  -e "s|__FRONTEND_IMAGE__|${ECR_FRONTEND}:${TAG}|g" \
  -e "s|__AWS_REGION__|${REGION}|g" \
  "${TMP_DIR}/task-frontend.json"

echo "==> Registering task definitions..."
API_TASK_ARN=$(aws ecs register-task-definition --cli-input-json "file://${TMP_DIR}/task-api.json" --region "$REGION" --query 'taskDefinition.taskDefinitionArn' --output text)
WORKER_TASK_ARN=$(aws ecs register-task-definition --cli-input-json "file://${TMP_DIR}/task-worker.json" --region "$REGION" --query 'taskDefinition.taskDefinitionArn' --output text)
FRONTEND_TASK_ARN=$(aws ecs register-task-definition --cli-input-json "file://${TMP_DIR}/task-frontend.json" --region "$REGION" --query 'taskDefinition.taskDefinitionArn' --output text)

NETWORK="awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${ECS_SG}],assignPublicIp=ENABLED}"

deploy_service() {
  local name="$1"
  local task_arn="$2"
  local desired="${3:-1}"
  local extra_args=("${@:4}")

  if aws ecs describe-services --cluster "$CLUSTER" --services "$name" --region "$REGION" --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
    echo "  Updating service ${name}..."
    aws ecs update-service \
      --cluster "$CLUSTER" \
      --service "$name" \
      --task-definition "$task_arn" \
      --desired-count "$desired" \
      --force-new-deployment \
      --region "$REGION" \
      "${extra_args[@]}" >/dev/null
  else
    echo "  Creating service ${name}..."
    aws ecs create-service \
      --cluster "$CLUSTER" \
      --service-name "$name" \
      --task-definition "$task_arn" \
      --desired-count "$desired" \
      --launch-type FARGATE \
      --network-configuration "$NETWORK" \
      --region "$REGION" \
      "${extra_args[@]}" >/dev/null
  fi
}

echo "==> Deploying ECS services..."
deploy_service docuforge-api "$API_TASK_ARN" 1 \
  --load-balancers "targetGroupArn=${API_TG_ARN},containerName=api,containerPort=8080"

deploy_service docuforge-frontend "$FRONTEND_TASK_ARN" 1 \
  --load-balancers "targetGroupArn=${FRONTEND_TG_ARN},containerName=frontend,containerPort=8080"

deploy_service docuforge-worker "$WORKER_TASK_ARN" 1

ALB_DNS=$(get_output AlbDnsName)
echo ""
echo "============================================"
echo "  DocuForge deployed on AWS ECS Fargate"
echo "============================================"
echo "  ALB:      http://${ALB_DNS}"
echo "  API:      http://${ALB_DNS} (Host: api.${DOMAIN})"
echo "  Frontend: http://${ALB_DNS} (Host: ${DOMAIN})"
echo ""
echo "  Point DNS to ALB, then run:"
echo "    bash deploy/aws/setup-domain.sh ${DOMAIN}"
echo "============================================"
