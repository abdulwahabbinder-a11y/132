#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../frontend"

# Stop stale Next.js processes that cause 404 on CSS/JS bundles
pkill -f "next dev" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 1

# Clear corrupted cache when switching between dev/build modes
rm -rf .next

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f .env.local ]; then
  echo "Creating .env.local from defaults (update with real Supabase keys)..."
  cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
NEXT_PUBLIC_API_URL=http://localhost:8080/api
EOF
fi

echo "Starting DocuForge frontend at http://localhost:3000"
npm run dev
