#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/fan-store"

wait_for_http() {
  local url="$1"
  local label="$2"
  local attempt

  for attempt in $(seq 1 30); do
    if curl --silent --show-error --fail --max-time 2 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for ${label} at ${url}" >&2
  return 1
}

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run reset-state.sh as root." >&2
  exit 1
fi

if [[ ! -d "${APP_ROOT}" ]]; then
  echo "Expected ${APP_ROOT} to exist." >&2
  exit 1
fi

set -a
source "${APP_ROOT}/.env"
set +a

runuser -u www-data -- /bin/bash -lc "set -a && source '${APP_ROOT}/.env' && set +a && cd '${APP_ROOT}' && npm run reset-state"
systemctl restart fansonly-token.service fansonly-admin-api.service fansonly-app.service
wait_for_http "http://127.0.0.1:9000/bootstrap" "bootstrap token service"
wait_for_http "http://127.0.0.1:4000/health" "internal admin API"
wait_for_http "http://127.0.0.1:3000/robots.txt" "Next.js app"
wait_for_http "http://127.0.0.1/robots.txt" "nginx frontend"

echo "FansOnly training state reset."
