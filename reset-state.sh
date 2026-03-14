#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/fan-store"

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
curl --silent --show-error --fail http://127.0.0.1/robots.txt >/dev/null

echo "FansOnly training state reset."
