#!/bin/sh
# Cloud Run requires an HTTP listener on $PORT. Celery does not expose HTTP,
# so we run a minimal health server alongside the worker process.
set -e

PORT="${PORT:-8080}"

python3 - <<'PY' &
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

port = int(os.environ.get("PORT", "8080"))

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *_args):
        pass

HTTPServer(("0.0.0.0", port), HealthHandler).serve_forever()
PY

exec celery -A app.workers.background.celery_app worker --loglevel=info --concurrency=1
