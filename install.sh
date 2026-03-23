#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[fansonly-install] %s\n' "$1"
}

run_as_www_data() {
  runuser -u www-data -- /bin/bash -lc "$1"
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local attempt

  for attempt in $(seq 1 30); do
    if curl --silent --show-error --fail --max-time 2 "$url" >/dev/null 2>&1; then
      log "${label} is responding at ${url}"
      return 0
    fi
    sleep 1
  done

  log "Timed out waiting for ${label} at ${url}"
  return 1
}

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run install.sh as root." >&2
  exit 1
fi

if [[ ! -r /etc/os-release ]]; then
  echo "Unable to detect operating system." >&2
  exit 1
fi

source /etc/os-release
if [[ "${ID:-}" != "ubuntu" ]]; then
  echo "This installer targets Ubuntu Server." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="/var/www/fan-store"
DATA_ROOT="/var/lib/fansonly"
NODE_BIN="/usr/bin/node"
NPM_BIN="/usr/bin/npm"
ADMIN_TOKEN_VALUE="WW-ANALYST-BOOTSTRAP-2026"
DEVOPS_PASSWORD="123456"

export DEBIAN_FRONTEND=noninteractive

log "Installing system packages"
apt-get update
apt-get install -y ca-certificates curl gnupg nginx openssh-server sqlite3 build-essential rsync

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q '^v20'; then
  log "Installing Node.js 20"
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
fi

NODE_BIN="$(command -v node)"
NPM_BIN="$(command -v npm)"

log "Stopping existing FansOnly services if present"
systemctl stop fansonly-app.service fansonly-admin-api.service fansonly-token.service 2>/dev/null || true

mkdir -p "${APP_ROOT}" "${DATA_ROOT}"
rsync -a --delete --delete-excluded \
  --exclude .git \
  --exclude .gitignore \
  --exclude .playwright-cli \
  --exclude docs \
  --exclude install.sh \
  --exclude node_modules \
  --exclude .next \
  --exclude var \
  "${SCRIPT_DIR}/" "${APP_ROOT}/"

id -u devops >/dev/null 2>&1 || useradd -m -s /bin/bash devops
echo "devops:${DEVOPS_PASSWORD}" | chpasswd
mkdir -p /home/devops/.local/bin
chown -R devops:devops /home/devops

cat > "${APP_ROOT}/.env" <<EOF
SITE_NAME="FansOnly"
APP_JWT_SECRET=fansonly-training-secret
ADMIN_TOKEN=${ADMIN_TOKEN_VALUE}
DEVOPS_SSH_PASSWORD=${DEVOPS_PASSWORD}
FANSONLY_DATA_DIR=${DATA_ROOT}
FANSONLY_DB_PATH=${DATA_ROOT}/fansonly.db
NEXT_PUBLIC_DEPRECATED_REACT=19.1.0
NEXT_PUBLIC_DEPRECATED_NEXT=15.1.0
EOF

chown -R www-data:www-data "${APP_ROOT}" "${DATA_ROOT}"
chmod -R 777 "${DATA_ROOT}"
usermod -aG www-data devops
chmod +x "${APP_ROOT}/bin/fansonly-shell-cli.mjs"
chmod 755 "${APP_ROOT}/reset-state.sh"

log "Installing application dependencies and building app"
if [[ -f "${APP_ROOT}/package-lock.json" ]]; then
  run_as_www_data "cd '${APP_ROOT}' && ${NPM_BIN} ci"
else
  run_as_www_data "cd '${APP_ROOT}' && ${NPM_BIN} install"
fi
run_as_www_data "set -a && source '${APP_ROOT}/.env' && set +a && cd '${APP_ROOT}' && ${NPM_BIN} run seed && ${NPM_BIN} run build"

cat > /usr/local/bin/fansonly-shell-cli <<EOF
#!/usr/bin/env bash
set -euo pipefail
set -a
source "${APP_ROOT}/.env"
set +a
export FANSONLY_DATA_DIR="${DATA_ROOT}"
cd "${APP_ROOT}"
exec "${NODE_BIN}" "${APP_ROOT}/bin/fansonly-shell-cli.mjs"
EOF
chmod 755 /usr/local/bin/fansonly-shell-cli

cat > /etc/systemd/system/fansonly-app.service <<EOF
[Unit]
Description=FansOnly Next.js app
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${APP_ROOT}
EnvironmentFile=${APP_ROOT}/.env
ExecStart=${NPM_BIN} run start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/fansonly-admin-api.service <<EOF
[Unit]
Description=FansOnly internal admin API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${APP_ROOT}
EnvironmentFile=${APP_ROOT}/.env
ExecStart=${NODE_BIN} ${APP_ROOT}/services/admin-api.mjs
Restart=always

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/fansonly-token.service <<EOF
[Unit]
Description=FansOnly bootstrap token service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${APP_ROOT}
EnvironmentFile=${APP_ROOT}/.env
ExecStart=${NODE_BIN} ${APP_ROOT}/services/token-service.mjs
Restart=always

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/nginx/sites-available/fansonly <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/fansonly /etc/nginx/sites-enabled/fansonly

cat > /etc/ssh/sshd_config.d/fansonly-devops.conf <<'EOF'
Match User devops
    PasswordAuthentication yes
    PubkeyAuthentication no
    AuthenticationMethods password
    AllowTcpForwarding no
    X11Forwarding no
    PermitTunnel no
    PermitTTY yes
    ForceCommand /usr/local/bin/fansonly-shell-cli
EOF

systemctl daemon-reload
systemctl enable ssh nginx fansonly-app.service fansonly-admin-api.service fansonly-token.service
systemctl restart ssh
systemctl restart fansonly-token.service
systemctl restart fansonly-admin-api.service
systemctl restart fansonly-app.service
nginx -t
systemctl restart nginx

wait_for_http "http://127.0.0.1:9000/bootstrap" "bootstrap token service"
wait_for_http "http://127.0.0.1:4000/health" "internal admin API"
wait_for_http "http://127.0.0.1:3000/robots.txt" "Next.js app"
wait_for_http "http://127.0.0.1/robots.txt" "nginx frontend"

log "Validating challenge route behavior"
curl --silent --show-error --fail "http://127.0.0.1/robots.txt" | grep -q "Disallow: /internal/exports/"
curl --silent --show-error --fail "http://127.0.0.1/console" | grep -q "Browser shell is disabled"
curl --silent --show-error --fail "http://127.0.0.1/legacy-preview" | grep -qi "reverse-shell"

shell_status="$(curl --silent --show-error --output /dev/null --write-out "%{http_code}" \
  -X POST "http://127.0.0.1/api/shell" \
  -H "Content-Type: application/json" \
  -d '{"session":"training","command":"whoami"}')"
if [[ "${shell_status}" != "410" ]]; then
  log "Expected /api/shell to return HTTP 410 but got ${shell_status}"
  exit 1
fi

echo "FansOnly training VM installed."
echo "App: http://<server-ip>/"
echo "Analyst bootstrap token: ${ADMIN_TOKEN_VALUE}"
echo "Browser shell route is disabled; legacy-preview now simulates reverse-shell drop only."
