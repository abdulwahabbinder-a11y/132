FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Build-time public env (required for Next.js static bundle)
ARG NEXT_PUBLIC_SITE_URL=https://docuforge.pro
ARG NEXT_PUBLIC_API_URL=https://api.docuforge.pro/api
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0

# Cloud Run sets PORT=8080 automatically; Next.js reads process.env.PORT
EXPOSE 8080

CMD ["npm", "start"]
