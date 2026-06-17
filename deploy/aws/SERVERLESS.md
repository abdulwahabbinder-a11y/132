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
                              ↑ runs ONLY when jobs queued
```

| Component | AWS Service | Idle cost |
|-----------|-------------|-----------|
| Frontend | S3 + CloudFront | ~$1-5/mo |
| API | Lambda + HTTP API | **$0** |
| Video render | Lambda (SQS trigger) | **$0** (pay per render) |
| Queue | SQS | ~$0 |

## Option A — CloudFormation Console (1-page install form)

### Step 1: Upload template

1. Open [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation)
2. **Create stack** → **Upload template**
3. Choose `deploy/aws/template.yaml`
4. Fill the form:
   - **Supabase URL / keys**
   - **Stripe Secret Key**
   - **ElevenLabs API Key**
   - **Domain name** (e.g. `docuforge.pro`)
5. Set **DeploymentPhase** = `infrastructure` (first deploy)
6. Create stack

### Step 2: Push Lambda Docker images

After stack CREATE, copy the **PostDeployImagePush** output commands, or run:

```bash
chmod +x deploy/aws/build-lambda-images.sh
bash deploy/aws/build-lambda-images.sh docuforge-serverless us-east-1
```

### Step 3: Enable Lambda functions

Update stack → set **DeploymentPhase** = `full` (keep all other parameters the same)

### Step 4: Upload frontend

```bash
bash deploy/aws/upload-frontend.sh docuforge-serverless
```

### Step 5: Domain

Point `docuforge.pro` CNAME to **CloudFront URL** from stack Outputs.

Set Stripe webhook to **StripeWebhookUrl** from Outputs.

---

## Option B — SAM CLI (builds images automatically)

```bash
cd deploy/aws
sam build --template template.yaml
sam deploy --guided
```

When prompted, set `DeploymentPhase=full` after first successful image build.

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
| `build-lambda-images.sh` | Build & push API + Worker images |
| `upload-frontend.sh` | Build & upload Next.js to S3 |
| `samconfig.toml` | SAM CLI defaults |

## Notes

- Worker Lambda: 3008 MB RAM (Lambda max), 15 min timeout — suitable for short/medium videos
- `/tmp` is ephemeral — plan S3 for persistent video storage in production
- Celery/Redis replaced by SQS in serverless mode (`JOB_QUEUE_MODE=sqs`)
