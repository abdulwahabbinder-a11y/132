# =============================================================================
# DocuForge Frontend — Production Dockerfile (Google Cloud Run / Cloud Run)
# =============================================================================
# Build:
#   docker build -t docuforge-frontend ./frontend \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://docuforge.pro \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.docuforge.pro/api \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
#
# Run locally:
#   docker run -p 8080:8080 docuforge-frontend
# =============================================================================

FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ── Build (NEXT_PUBLIC_* are baked into the JS bundle) ───────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL=https://docuforge.pro
ARG NEXT_PUBLIC_API_URL=https://api.docuforge.pro/api
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Production runner (minimal image) ────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=8080 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/ || exit 1

CMD ["node", "server.js"]
