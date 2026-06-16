FROM node:18-alpine

WORKDIR /app

# libc compatibility for some Next.js native deps on Alpine
RUN apk add --no-cache libc6-compat

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build for production
COPY . .
RUN npm run build

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
