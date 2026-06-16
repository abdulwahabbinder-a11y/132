#!/usr/bin/env bash
# Start DocuForge preview: frontend + Cloudflare tunnel
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=3000
LOG="/tmp/docuforge-tunnel.log"

pkill -f "cloudflared tunnel" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
sleep 1

# Start frontend if not running
if ! curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then
  echo "==> Building frontend..."
  cd "$ROOT/frontend"
  rm -rf .next
  npm run build
  tmux -f /exec-daemon/tmux.portal.conf kill-session -t docuforge-frontend 2>/dev/null || true
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s docuforge-frontend -c "$ROOT/frontend" -- "${SHELL:-zsh}" -l
  tmux -f /exec-daemon/tmux.portal.conf send-keys -t docuforge-frontend:0.0 "npm run start" C-m
  sleep 5
fi

echo "==> Starting Cloudflare tunnel..."
tmux -f /exec-daemon/tmux.portal.conf kill-session -t docuforge-tunnel 2>/dev/null || true
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s docuforge-tunnel -c "$ROOT" -- "${SHELL:-zsh}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t docuforge-tunnel:0.0 "npx --yes cloudflared tunnel --url http://127.0.0.1:${PORT} 2>&1 | tee ${LOG}" C-m

echo "==> Waiting for public URL..."
for i in $(seq 1 30); do
  URL=$(rg -o 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1 || true)
  if [[ -n "$URL" ]]; then
    echo ""
    echo "============================================"
    echo "  LIVE PREVIEW URLS"
    echo "============================================"
    echo "  Landing:  ${URL}"
    echo "  Admin:    ${URL}/admin"
    echo "  Login:    ${URL}/auth/login"
    echo ""
    echo "  Admin email:    support@docuforge.pro"
    echo "  Admin password: (see frontend/.env.local DEMO_ADMIN_PASSWORD)"
    echo "============================================"
    exit 0
  fi
  sleep 1
done

echo "Tunnel URL not ready yet. Check: tail -f ${LOG}"
exit 1
