# DocuForge on AWS

Deploy **docuforge.pro** on **AWS ECS Fargate** with **Application Load Balancer**, **ECR**, and **Secrets Manager**.

> GCP deploy is still available at [deploy/gcp/DEPLOY.md](../gcp/DEPLOY.md). Application code is cloud-agnostic — same Docker images work on both.

## Architecture

```
                    ┌─────────────────────────────────────┐
  docuforge.pro ───►│  Application Load Balancer (ALB)    │
  api.docuforge.pro │  ├─ Host api.* → API target group   │
                    │  └─ default    → Frontend target    │
                    └──────────┬──────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │ ECS Fargate │      │ ECS Fargate │      │ ECS Fargate │
  │  Frontend   │      │    API      │      │   Worker    │
  │  Next.js    │      │  FastAPI    │      │   Celery    │
  └─────────────┘      └──────┬──────┘      └──────┬──────┘
                              │                     │
                              └──────────┬──────────┘
                                         ▼
                              ┌─────────────────────┐
                              │ Upstash Redis /       │
                              │ ElastiCache           │
                              └─────────────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │ Supabase (Postgres) │
                              └─────────────────────┘
```

| Service | AWS Product | URL |
|---------|-------------|-----|
| Landing + App UI | ECS Fargate + ALB | `https://docuforge.pro` |
| FastAPI Backend | ECS Fargate + ALB | `https://api.docuforge.pro` |
| Video Worker | ECS Fargate (no ALB) | internal only |
| Container images | ECR | `docuforge/backend`, `docuforge/frontend` |
| Secrets | Secrets Manager | `docuforge/*` |
| Redis queue | Upstash (recommended) or ElastiCache | `REDIS_URL` |

## Prerequisites

1. [AWS account](https://aws.amazon.com/) with admin or deploy permissions
2. [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured (`aws configure`)
3. [Docker](https://docs.docker.com/get-docker/) installed locally (or use CodeBuild)
4. Supabase project + migrations applied
5. Domain `docuforge.pro` (Route 53 or external DNS)

## Quick deploy (4 steps)

```bash
export AWS_REGION=us-east-1
export DOMAIN=docuforge.pro

# 1. Store secrets
chmod +x deploy/aws/*.sh
bash deploy/aws/setup-secrets.sh

# 2. Create ECS cluster, ALB, ECR, IAM (CloudFormation)
bash deploy/aws/setup-infrastructure.sh

# 3. Build images, push to ECR, deploy ECS services
bash deploy/aws/deploy.sh

# 4. Point domain to ALB + enable HTTPS
bash deploy/aws/setup-domain.sh docuforge.pro
```

## Step 1 — Secrets Manager

```bash
bash deploy/aws/setup-secrets.sh us-east-1
```

Creates secrets under `docuforge/` prefix:

| Secret | Used by |
|--------|---------|
| `docuforge/supabase-url` | API, Worker |
| `docuforge/supabase-service-key` | API, Worker |
| `docuforge/redis-url` | API, Worker |
| `docuforge/stripe-secret` | API |
| `docuforge/nvidia-nim` | Worker |
| `docuforge/elevenlabs` | Worker |
| ... | see `env.aws.example` |

**Redis:** Use [Upstash](https://upstash.com/) (serverless, no VPC required):

```
REDIS_URL=rediss://default:PASSWORD@your-host.upstash.io:6379
```

## Step 2 — Infrastructure (CloudFormation)

```bash
bash deploy/aws/setup-infrastructure.sh docuforge docuforge.pro
```

Creates:
- ECS cluster `docuforge`
- ECR repos `docuforge/backend`, `docuforge/frontend`
- ALB with host-based routing (`api.domain` → API, default → frontend)
- IAM roles, security groups, CloudWatch log groups

### Custom VPC

If you don't use the default VPC, deploy the template manually:

```bash
aws cloudformation deploy \
  --template-file deploy/aws/cloudformation/docuforge.yaml \
  --stack-name docuforge \
  --parameter-overrides \
    DomainName=docuforge.pro \
    VpcId=vpc-xxx \
    PublicSubnetIds=subnet-a,subnet-b \
    PrivateSubnetIds=subnet-c,subnet-d \
  --capabilities CAPABILITY_NAMED_IAM
```

For production, place Fargate tasks in **private subnets** with a NAT gateway.

## Step 3 — Build & deploy

```bash
export DOMAIN=docuforge.pro
export AWS_REGION=us-east-1
bash deploy/aws/deploy.sh v1.0.0
```

This script:
1. Builds backend + frontend Docker images
2. Pushes to ECR
3. Registers ECS task definitions
4. Creates/updates three ECS services (api, frontend, worker)

### Health checks

| Service | Health endpoint |
|---------|----------------|
| API (ALB + container) | `GET /api/health` |
| Frontend | `GET /` |
| Worker | `GET /` (sidecar HTTP server in `worker_entrypoint.sh`) |

## Step 4 — Domain & HTTPS

### Route 53 (automated)

```bash
bash deploy/aws/setup-domain.sh docuforge.pro
```

### External DNS (Hostinger, Cloudflare, etc.)

Point these records to the ALB DNS name (from CloudFormation output):

| Record | Type | Value |
|--------|------|-------|
| `docuforge.pro` | CNAME/ALIAS | `docuforge-alb-xxxxx.us-east-1.elb.amazonaws.com` |
| `api.docuforge.pro` | CNAME/ALIAS | same ALB DNS |

### HTTPS with ACM

```bash
aws acm request-certificate \
  --domain-name docuforge.pro \
  --subject-alternative-names api.docuforge.pro \
  --validation-method DNS \
  --region us-east-1
```

After DNS validation, add an HTTPS listener on the ALB (port 443) forwarding to the same target groups.

## CI/CD with CodeBuild

Use `deploy/aws/buildspec.yml` in AWS CodeBuild:

1. Connect your GitHub repo
2. Set env vars: `AWS_REGION`, `DOMAIN`, `STACK_NAME`
3. CodeBuild needs ECR push + ECS deploy permissions

## ECS sizing (defaults)

| Service | CPU | Memory | Notes |
|---------|-----|--------|-------|
| API | 1 vCPU | 2 GB | FFmpeg + Remotion in-process |
| Worker | 2 vCPU | 4 GB | Video rendering, always 1 task |
| Frontend | 0.5 vCPU | 1 GB | Next.js standalone |

Scale API/frontend desired count in ECS console or update `deploy.sh`.

## GCP → AWS mapping

| Google Cloud | AWS equivalent |
|--------------|----------------|
| Cloud Run | ECS Fargate |
| Artifact Registry | ECR |
| Secret Manager | Secrets Manager |
| Cloud Build | CodeBuild |
| Cloud Run domain mapping | Route 53 + ALB |
| Memorystore Redis | ElastiCache or Upstash |
| Cloud Logging | CloudWatch Logs |

## No code changes required

The app already supports AWS deployment:

- `PORT=8080` — used by ECS/ALB
- `GET /api/health` — ALB health check
- `CORS_ORIGINS` + `FRONTEND_URL` — env-based
- API keys from Supabase `platform_settings` with env fallback
- Ephemeral `/tmp` storage (add S3 later for persistent videos)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Task fails health check | Check CloudWatch `/ecs/docuforge-api` logs; verify `/api/health` |
| Worker not processing jobs | Verify `REDIS_URL` secret; check worker logs |
| CORS errors | Set `CORS_ORIGINS=https://docuforge.pro,https://www.docuforge.pro` on API task |
| Frontend unstyled | Rebuild frontend image — `NEXT_PUBLIC_*` are baked at build time |
| Video files lost on restart | Fargate `/tmp` is ephemeral — plan S3 + CloudFront upgrade |

## Estimated monthly cost (light usage)

~$40–100 (Fargate + ALB + worker always-on + Upstash free tier)

## File layout

```
deploy/aws/
├── DEPLOY.md                    ← this guide
├── env.aws.example              ← environment reference
├── setup-secrets.sh             ← Secrets Manager
├── setup-infrastructure.sh      ← CloudFormation
├── deploy.sh                    ← build + push + ECS deploy
├── setup-domain.sh              ← Route 53 + ACM guide
├── buildspec.yml                ← CodeBuild CI/CD
├── cloudformation/docuforge.yaml
└── ecs/
    ├── task-api.json
    ├── task-worker.json
    └── task-frontend.json
```
