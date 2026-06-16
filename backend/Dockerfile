FROM node:22-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip python3-venv ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY apps/remotion/package.json apps/remotion/package.json
RUN npm install --workspace apps/remotion

COPY backend/requirements.txt /app/requirements.txt
RUN python3 -m venv /opt/venv \
    && pip install --no-cache-dir -r /app/requirements.txt

COPY backend/app /app/app
COPY apps/remotion /app/apps/remotion

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
