#!/usr/bin/env bash
# Start DocuForge preview: frontend + Cloudflare tunnel
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=3000
LOG="/tmp/docuforge-tunnel.log"

pkill -f "cloudflared tunnel" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2

echo "==> Building frontend (clean)..."
cd "$ROOT/frontend"
rm -rf .next
npm run build

tmux -f /exec-daemon/tmux.portal.conf kill-session -t frontend-live 2>/dev/null || true
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s frontend-live -c "$ROOT/frontend" -- "${SHELL:-zsh}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t frontend-live:0.0 "npm run start" C-m

echo "==> Waiting for frontend on :${PORT}..."
for i in $(seq 1 30); do
  page_code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/auth/login" || echo "000")
  css_path=$(curl -s "http://127.0.0.1:${PORT}/auth/login" | rg -o '/_next/static/css/[^"]+\.css' | head -1 || true)
  if [[ "$page_code" == "200" && -n "$css_path" ]]; then
    css_code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}${css_path}" || echo "000")
    if [[ "$css_code" == "200" ]]; then
      break
    fi
  fi
  sleep 1
done

echo "==> Starting Cloudflare tunnel..."
rm -f "$LOG"
tmux -f /exec-daemon/tmux.portal.conf kill-session -t docuforge-tunnel 2>/dev/null || true
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s docuforge-tunnel -c "$ROOT" -- "${SHELL:-zsh}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t docuforge-tunnel:0.0 "npx --yes cloudflared tunnel --protocol http2 --url http://127.0.0.1:${PORT} 2>&1 | tee ${LOG}" C-m

echo "==> Waiting for public URL..."
URL=""
for i in $(seq 1 45); do
  URL=$(rg -o 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1 || true)
  if [[ -n "$URL" ]]; then
    sleep 4
    page_code=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 20 "${URL}/auth/login" || echo "000")
    css_path=$(curl -sL --max-time 20 "${URL}/auth/login" | rg -o '/_next/static/css/[^"]+\.css' | head -1 || true)
    css_code="000"
    if [[ -n "$css_path" ]]; then
      css_code=$(curl -sL -o /dev/null -w "%{http_code}" --max-time 20 "${URL}${css_path}" || echo "000")
    fi
    if [[ "$page_code" == "200" && "$css_code" == "200" ]]; then
      break
    fi
  fi
  sleep 1
done

if [[ -z "$URL" ]]; then
  echo "Tunnel URL not ready yet. Check: tail -f ${LOG}"
  exit 1
fi

echo ""
echo "============================================"
echo "  LIVE PREVIEW URLS"
echo "============================================"
echo "  Landing:    ${URL}"
echo "  Login:      ${URL}/auth/login"
echo "  Dashboard:  ${URL}/dashboard"
echo "  Admin:      ${URL}/admin"
echo "  Create:     ${URL}/create"
echo ""
echo "  Admin email:    support@docuforge.pro"
echo "  Admin password: (see frontend/.env.local DEMO_ADMIN_PASSWORD)"
echo "  User email:     demo@docuforge.pro"
echo "  User password:  (see frontend/.env.local DEMO_USER_PASSWORD)"
echo "============================================"
