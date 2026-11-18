#!/usr/bin/env bash
# Build, then serve the fresh build on :4173 — always restarting the preview server, because a server
# left over from an older build serves stale HTML whose hashed assets 404 (bit us twice, #47 and #142).
#   bash loop/preview.sh          # build + restart preview, wait until it answers
#   bash loop/preview.sh --no-build
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "${1:-}" != "--no-build" ]]; then
  out=$(npm run docs:build 2>&1) || true
  grep -qE "build complete" <<<"$out" || { echo "$out" | tail -20; echo "build failed"; exit 1; }
  grep -E "build complete" <<<"$out"
fi
pkill -f "vitepress preview" 2>/dev/null || true
sleep 1
nohup npm run docs:preview -- --port 4173 > "${TMPDIR:-/tmp}/custo-preview.log" 2>&1 &
for _ in $(seq 1 40); do
  if curl -fsS -o /dev/null http://localhost:4173/custo/ 2>/dev/null; then
    # the page must reference assets that exist in this build
    asset=$(curl -fsS http://localhost:4173/custo/ | grep -oE '/custo/assets/[^"]+\.js' | head -1)
    curl -fsS -o /dev/null "http://localhost:4173${asset}" && { echo "preview ready (fresh build, ${asset##*/} OK)"; exit 0; }
  fi
  sleep 0.5
done
echo "preview did not come up — see ${TMPDIR:-/tmp}/custo-preview.log"; exit 1
