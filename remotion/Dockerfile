FROM node:20-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg libgbm1 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libxss1 libxshmfence-dev libxcomposite1 libxrandr2 libxdamage1 \
    libxkbcommon0 libpangocairo-1.0-0 libpango-1.0-0 \
 && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    REMOTION_CHROME_PATH=/usr/bin/chromium

WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 3000
CMD ["npx", "remotion", "studio"]
