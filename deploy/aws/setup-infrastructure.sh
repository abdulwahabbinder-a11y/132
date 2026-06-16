#!/usr/bin/env bash
# Deploy DocuForge CloudFormation stack (ECS cluster, ALB, ECR, IAM)
# Usage: bash deploy/aws/setup-infrastructure.sh [stack-name] [domain]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STACK_NAME="${1:-docuforge}"
DOMAIN="${2:-docuforge.pro}"
REGION="${AWS_REGION:-us-east-1}"

echo "==> Detecting default VPC and subnets in ${REGION}..."
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region "$REGION")
if [[ -z "$VPC_ID" || "$VPC_ID" == "None" ]]; then
  echo "ERROR: No default VPC found. Create a VPC or pass subnets manually via CloudFormation console."
  exit 1
fi

PUBLIC_SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" "Name=map-public-ip-on-launch,Values=true" \
  --query 'Subnets[*].SubnetId' --output text --region "$REGION" | tr '\t' ',')

if [[ -z "$PUBLIC_SUBNETS" ]]; then
  PUBLIC_SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${VPC_ID}" \
    --query 'Subnets[*].SubnetId' --output text --region "$REGION" | tr '\t' ',')
fi

PRIVATE_SUBNETS="${PUBLIC_SUBNETS}"

echo "  VPC:             ${VPC_ID}"
echo "  Public subnets:  ${PUBLIC_SUBNETS}"
echo "  Private subnets: ${PRIVATE_SUBNETS} (same as public — add NAT for production)"

aws cloudformation deploy \
  --template-file "${ROOT}/deploy/aws/cloudformation/docuforge.yaml" \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
    DomainName="$DOMAIN" \
    VpcId="$VPC_ID" \
    PublicSubnetIds="$PUBLIC_SUBNETS" \
    PrivateSubnetIds="$PRIVATE_SUBNETS" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION"

ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='AlbDnsName'].OutputValue" \
  --output text)

echo ""
echo "==> Infrastructure ready"
echo "    ALB DNS: ${ALB_DNS}"
echo "    Next:    bash deploy/aws/deploy.sh"
