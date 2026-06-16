# =============================================================================
# DocuForge Backend API — Production Dockerfile (Google Cloud Run)
# =============================================================================
# Build:
#   docker build -t docuforge-api ./backend
#
# Run API locally:
#   docker run -p 8080:8080 --env-file .env docuforge-api
#
# Run Celery worker (same image, different command):
#   docker run -p 8080:8080 --env-file .env docuforge-api ./worker_entrypoint.sh
# =============================================================================

FROM python:3.11-slim

# FFmpeg for video processing; gcc for native Python wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1001 appuser

WORKDIR /app

# Install Python deps first (Docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x worker_entrypoint.sh \
    && mkdir -p /tmp/docuforge/assets /tmp/docuforge/output \
    && chown -R appuser:appuser /app /tmp/docuforge

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT}/health || exit 1

# Cloud Run injects PORT=8080 automatically
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1"]
