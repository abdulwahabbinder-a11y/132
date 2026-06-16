# =============================================================================
# DocuForge Backend + Remotion Renderer — Production Dockerfile
# =============================================================================
# Build from repo root:
#   docker build -f backend/Dockerfile -t docuforge-api .
#
# Run API:
#   docker run -p 8080:8080 --env-file .env docuforge-api
#
# Run Celery worker:
#   docker run --env-file .env docuforge-api ./worker_entrypoint.sh
# =============================================================================

FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
       | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
       > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1001 appuser

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY remotion/ /app/remotion/

RUN cd /app/remotion \
    && npm ci --omit=dev \
    && mkdir -p public/jobs \
    && chown -R appuser:appuser /app /app/remotion

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    REMOTION_PROJECT_DIR=/app/remotion

RUN chmod +x worker_entrypoint.sh \
    && mkdir -p /tmp/docuforge/assets /tmp/docuforge/output \
    && chown -R appuser:appuser /tmp/docuforge

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT}/api/health || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]
