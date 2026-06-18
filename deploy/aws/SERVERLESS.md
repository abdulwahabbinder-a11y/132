# DocuForge — Serverless AWS (Zero Idle Cost)

Single CloudFormation template for **Lambda + API Gateway + SQS** architecture. You only pay when API requests run and when videos render.

## Architecture

```
Users → CloudFront → S3 (frontend static)
              └─ /api/* → API Gateway → Lambda (FastAPI)
                                              ↓
                                         SQS Queue
                                              ↓
                              Lambda Worker (FFmpeg + Remotion)
                              → uploads MP4 to S3 VideosBucket
                              ↑ runs ONLY when jobs queued
```

| Component | AWS Service | Idle cost |
|-----------|-------------|-----------|
| Frontend | S3 + CloudFront | ~$1-5/mo |
| API | Lambda + HTTP API | **$0** |
| Video render | Lambda (SQS trigger) | **$0** (pay per render) |
| Video files | S3 (30-day lifecycle) | pennies |
| Queue | SQS | ~$0 |

---

## Recommended: one-command deploy

**Important:** Do **not** set `DeploymentPhase=full` until Docker images exist in ECR. Use the script below — it handles the correct order automatically.

```bash
chmod +x deploy/aws/deploy-serverless.sh deploy/aws/build-lambda-images.sh
bash deploy/aws/deploy-serverless.sh docuforge-serverless us-east-1
```

This script:
1. Deploys **infrastructure** (ECR, SQS, S3, CloudFront — no Lambdas)
2. Builds & pushes **API + Worker** Docker images to ECR
3. Updates stack to **full** (creates Lambdas — images now exist)

---

## Option A — CloudFormation Console (manual)

### Step 1: Upload template

1. Open [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation)
2. **Create stack** → **Upload template** → `deploy/aws/template.yaml`
3. Fill the form (Supabase, Stripe, ElevenLabs, domain)
4. Set **DeploymentPhase** = `infrastructure` ← **required first**
5. Create stack

### Step 2: Push Lambda Docker images (from your Mac, repo root)

```bash
cd /path/to/your/repo
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=114490783207   # your account

aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

docker build -f backend/Dockerfile.lambda-api \
  -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/docuforge/docuforge-serverless/api:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/docuforge/docuforge-serverless/api:latest

docker build -f backend/Dockerfile.lambda-worker \
  -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/docuforge/docuforge-serverless/worker:latest .
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/docuforge/docuforge-serverless/worker:latest
```

Or use the helper script:

```bash
bash deploy/aws/build-lambda-images.sh docuforge-serverless us-east-1
```

### Step 3: Enable Lambda functions

Update stack → set **DeploymentPhase** = `full` (keep all other parameters the same)

### Step 4: Upload frontend

```bash
bash deploy/aws/upload-frontend.sh docuforge-serverless us-east-1
```

### Step 5: Domain

Point `docuforge.pro` CNAME to **FrontendUrl** from stack Outputs.  
Set Stripe webhook to **StripeWebhookUrl** from Outputs.

---

## Option B — SAM CLI

```bash
cd deploy/aws
sam build --template template.yaml
sam deploy --guided   # use DeploymentPhase=infrastructure first
bash build-lambda-images.sh docuforge-serverless us-east-1
# then sam deploy with DeploymentPhase=full
```

---

## Parameters (install form)

| Parameter | Required | Description |
|-----------|----------|-------------|
| `SupabaseUrl` | Yes | `https://xxx.supabase.co` |
| `SupabaseAnonKey` | Yes | Public anon key |
| `SupabaseServiceKey` | Yes | Service role key |
| `SupabaseJwtSecret` | Yes | JWT secret |
| `StripeSecretKey` | Yes | Stripe API key |
| `ElevenLabsApiKey` | Yes | Voice synthesis |
| `StripeWebhookSecret` | No | Webhook signing |
| `ClaudeApiKey` | No | Research LLM |
| `NvidiaNimApiKey` | No | Image/video AI |
| `DomainName` | No | Default `docuforge.pro` |
| `DeploymentPhase` | No | `infrastructure` then `full` |

---

## Health check

```
GET https://<api-id>.execute-api.<region>.amazonaws.com/api/health
→ {"status":"healthy","service":"DocuForge AI"}
```

---

## Common errors

| Error | Fix |
|-------|-----|
| `Source image ... does not exist` | Push Docker images **before** `DeploymentPhase=full` |
| `MemorySize ... less than or equal to 3008` | Use latest `template.yaml` (worker capped at 3008 MB) |
| `UPDATE_ROLLBACK_COMPLETE` | Fix cause, then **Stack actions → Continue update rollback** if needed, push images, retry |

---

## Cost comparison

| Mode | Idle cost | Best for |
|------|-----------|----------|
| **Serverless (this template)** | ~$0 + CloudFront | Low traffic, pay-per-render |
| ECS Fargate ([DEPLOY.md](DEPLOY.md)) | ~$60-100/mo | Always-on, heavy traffic |

---

## Files

| File | Purpose |
|------|---------|
| `template.yaml` | Single CloudFormation/SAM template |
| `deploy-serverless.sh` | **Recommended** — full deploy in correct order |
| `build-lambda-images.sh` | Build & push API + Worker images |
| `upload-frontend.sh` | Build & upload Next.js to S3 |
| `samconfig.toml` | SAM CLI defaults |

## Notes

- Worker Lambda: 3008 MB RAM, 10 GB `/tmp`, 15 min timeout
- Rendered videos upload to **VideosBucket** (S3); downloads use presigned URLs
- Celery/Redis replaced by SQS in serverless mode (`JOB_QUEUE_MODE=sqs`)
