#!/usr/bin/env bash
# Route 53 + ACM HTTPS setup for DocuForge on AWS
# Usage: bash deploy/aws/setup-domain.sh [domain] [stack-name]
set -euo pipefail

DOMAIN="${1:-docuforge.pro}"
STACK_NAME="${2:-docuforge}"
REGION="${AWS_REGION:-us-east-1}"
ALB_REGION="$REGION"

# ACM certificates for ALB must be in the same region as the ALB
CERT_REGION="$ALB_REGION"

ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='AlbDnsName'].OutputValue" \
  --output text)

ALB_ZONE_ID=$(aws elbv2 describe-load-balancers \
  --region "$REGION" \
  --query "LoadBalancers[?DNSName=='${ALB_DNS}'].CanonicalHostedZoneId" \
  --output text)

ALB_ARN=$(aws elbv2 describe-load-balancers \
  --region "$REGION" \
  --query "LoadBalancers[?DNSName=='${ALB_DNS}'].LoadBalancerArn" \
  --output text)

echo "==> DocuForge domain setup for ${DOMAIN}"
echo "    ALB: ${ALB_DNS}"
echo ""

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name "$DOMAIN" \
  --query "HostedZones[?Name=='${DOMAIN}.'].Id" \
  --output text 2>/dev/null | sed 's|/hostedzone/||')

if [[ -z "$HOSTED_ZONE_ID" || "$HOSTED_ZONE_ID" == "None" ]]; then
  echo "No Route 53 hosted zone found for ${DOMAIN}."
  echo ""
  echo "Manual DNS (at your registrar or DNS provider):"
  echo "  ${DOMAIN}      CNAME/ALIAS → ${ALB_DNS}"
  echo "  api.${DOMAIN}  CNAME/ALIAS → ${ALB_DNS}"
  echo ""
  echo "For HTTPS, request an ACM certificate in ${CERT_REGION}:"
  echo "  aws acm request-certificate --domain-name ${DOMAIN} --subject-alternative-names api.${DOMAIN} --validation-method DNS --region ${CERT_REGION}"
  exit 0
fi

echo "==> Creating Route 53 alias records..."
CHANGE_BATCH=$(cat <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${DOMAIN}",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "${ALB_ZONE_ID}",
          "DNSName": "${ALB_DNS}",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.${DOMAIN}",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "${ALB_ZONE_ID}",
          "DNSName": "${ALB_DNS}",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF
)

aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch "$CHANGE_BATCH" >/dev/null

echo "  ✓ ${DOMAIN} → ALB"
echo "  ✓ api.${DOMAIN} → ALB"
echo ""
echo "==> HTTPS (ACM)"
echo "Request a certificate:"
echo "  aws acm request-certificate \\"
echo "    --domain-name ${DOMAIN} \\"
echo "    --subject-alternative-names api.${DOMAIN} \\"
echo "    --validation-method DNS \\"
echo "    --region ${CERT_REGION}"
echo ""
echo "After validation, add an HTTPS listener on the ALB:"
echo "  aws elbv2 create-listener \\"
echo "    --load-balancer-arn ${ALB_ARN} \\"
echo "    --protocol HTTPS --port 443 \\"
echo "    --certificates CertificateArn=arn:aws:acm:... \\"
echo "    --default-actions Type=forward,TargetGroupArn=<frontend-tg-arn>"
