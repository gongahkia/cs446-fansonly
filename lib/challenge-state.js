import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "./env.js";

function defaultState() {
  return {
    shellSessions: {},
    shellSessionCounter: 1,
    virtualHosts: {
      "www-data": createVirtualHost("www-data"),
      "devops": createVirtualHost("devops"),
      "root": createVirtualHost("root")
    }
  };
}

function createVirtualHost(actor) {
  const homes = {
    "www-data": "/var/www/fan-store",
    devops: "/home/devops",
    root: "/root"
  };

  return {
    actor,
    cwd: homes[actor],
    home: homes[actor],
    env: {
      PATH: actor === "devops"
        ? "/home/devops/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
        : "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    },
    files: createSeedFiles(actor),
    flags: {
      tarEscalated: false,
      pathEscalated: false
    }
  };
}

function createSeedFiles(actor) {
  const env = getEnv();
  const files = {
    "/": { type: "dir" },
    "/var": { type: "dir" },
    "/var/www": { type: "dir" },
    "/var/www/fan-store": { type: "dir" },
    // top-level app files
    "/var/www/fan-store/package.json": {
      type: "file",
      content: '{"name":"fan-store","version":"2.4.1","private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start"}}'
    },
    "/var/www/fan-store/next.config.mjs": {
      type: "file",
      content: 'const nextConfig = { reactStrictMode: true };\nexport default nextConfig;'
    },
    "/var/www/fan-store/.env.example": {
      type: "file",
      content: "SITE_NAME=\nADMIN_TOKEN=\nDEVOPS_SSH_PASSWORD=\nAPP_JWT_SECRET="
    },
    // src directory
    "/var/www/fan-store/src": { type: "dir" },
    "/var/www/fan-store/src/app": { type: "dir" },
    "/var/www/fan-store/src/app/page.jsx": {
      type: "file",
      content: 'export default function Home() { return <main>FansOnly</main>; }'
    },
    "/var/www/fan-store/src/app/layout.jsx": {
      type: "file",
      content: 'export const metadata = { title: "FansOnly" };\nexport default function RootLayout({ children }) { return <html><body>{children}</body></html>; }'
    },
    "/var/www/fan-store/src/components": { type: "dir" },
    "/var/www/fan-store/src/components/Header.jsx": {
      type: "file",
      content: 'export default function Header() { return <nav>FansOnly nav</nav>; }'
    },
    "/var/www/fan-store/src/components/Footer.jsx": {
      type: "file",
      content: 'export default function Footer() { return <footer>© FansOnly 2026</footer>; }'
    },
    "/var/www/fan-store/src/lib": { type: "dir" },
    "/var/www/fan-store/src/lib/db.js": {
      type: "file",
      content: 'import Database from "better-sqlite3";\nconst db = new Database(process.env.DB_PATH);\nexport default db;'
    },
    "/var/www/fan-store/src/lib/auth.js": {
      type: "file",
      content: '// auth helper — reads session from cookies\nexport function getSession(req) { return req.cookies.get("fansonly_session"); }'
    },
    // public assets
    "/var/www/fan-store/public": { type: "dir" },
    "/var/www/fan-store/public/favicon.ico": { type: "file", content: "" },
    "/var/www/fan-store/public/assets": { type: "dir" },
    "/var/www/fan-store/public/assets/logo.svg": { type: "file", content: "<svg>...</svg>" },
    // node_modules marker
    "/var/www/fan-store/node_modules": { type: "dir" },
    "/var/www/fan-store/node_modules/.package-lock.json": { type: "file", content: "{}" },
    // scripts
    "/var/www/fan-store/scripts": { type: "dir" },
    "/var/www/fan-store/scripts/seed.mjs": {
      type: "file",
      content: '// seeds the database with default users\nimport db from "../src/lib/db.js";\ndb.exec("INSERT INTO users ...");'
    },
    "/var/www/fan-store/scripts/migrate.sh": {
      type: "file",
      content: '#!/bin/sh\necho "running migrations..."\nsqlite3 $DB_PATH < migrations/001.sql'
    },
    // data & logs
    "/var/www/fan-store/data": { type: "dir" },
    "/var/www/fan-store/data/fansonly.db": { type: "file", content: "[SQLite binary]" },
    "/var/www/fan-store/logs": { type: "dir" },
    "/var/www/fan-store/logs/access.log": {
      type: "file",
      content: '2026-03-14 08:12:01 GET /api/catalog 200\n2026-03-14 08:12:44 POST /api/webhook/test 200\n2026-03-14 08:15:02 GET /internal/exports/users.csv 200'
    },
    "/var/www/fan-store/logs/error.log": {
      type: "file",
      content: "2026-03-13 23:41:18 [warn] unhandled rejection in legacy-preview action\n2026-03-14 02:05:33 [error] ECONNREFUSED 127.0.0.1:9000"
    },
    // deploy config — .env hidden here
    "/var/www/fan-store/deploy": { type: "dir" },
    "/var/www/fan-store/deploy/Dockerfile": {
      type: "file",
      content: 'FROM node:20-slim\nWORKDIR /app\nCOPY . .\nRUN npm ci --production\nCMD ["npm","start"]'
    },
    "/var/www/fan-store/deploy/docker-compose.yml": {
      type: "file",
      content: 'version: "3.8"\nservices:\n  web:\n    build: .\n    env_file: ./config/.env.production\n    ports:\n      - "3000:3000"'
    },
    "/var/www/fan-store/deploy/config": { type: "dir" },
    "/var/www/fan-store/deploy/config/nginx.conf": {
      type: "file",
      content: 'server {\n  listen 80;\n  server_name fans.only.local;\n  location / { proxy_pass http://127.0.0.1:3000; }\n}'
    },
    "/var/www/fan-store/deploy/config/.env.production": {
      type: "file",
      mode: "0640",
      content: [
        "SITE_NAME=FansOnly",
        "NEXT_PUBLIC_DEPRECATED_REACT=19.1.0",
        "NEXT_PUBLIC_DEPRECATED_NEXT=15.1.0",
        `DEVOPS_SSH_PASSWORD=${env.devopsPassword}`,
        `ADMIN_TOKEN=${env.adminToken}`,
        `APP_JWT_SECRET=fansonly-dev-secret`
      ].join("\n")
    },
    // migrations
    "/var/www/fan-store/migrations": { type: "dir" },
    "/var/www/fan-store/migrations/001.sql": {
      type: "file",
      content: "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, password TEXT, role TEXT);"
    },
    "/var/www/fan-store/migrations/002.sql": {
      type: "file",
      content: "ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;"
    },
    // tests
    "/var/www/fan-store/tests": { type: "dir" },
    "/var/www/fan-store/tests/auth.test.js": {
      type: "file",
      content: '// placeholder test\nimport { expect, test } from "vitest";\ntest("auth returns session", () => { expect(true).toBe(true); });'
    },
    "/etc": { type: "dir" },
    "/etc/cron.d": { type: "dir" },
    "/etc/cron.d/fansonly-backup": {
      type: "file",
      content: "* * * * * root cd /srv/fan-backups/staging && tar -czf /root/backups/fans-$(date +%F-%H%M).tgz *\n"
    },
    "/usr": { type: "dir" },
    "/usr/local": { type: "dir" },
    "/usr/local/sbin": { type: "dir" },
    "/usr/local/sbin/fansonly-maintenance.sh": {
      type: "file",
      content: [
        "#!/bin/sh",
        "PATH=/home/devops/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "cd /srv/fan-backups/staging",
        "du -sh . > /var/log/fansonly-backup-size.log",
        "find . -maxdepth 1 -type f > /var/log/fansonly-backup-files.log"
      ].join("\n")
    },
    "/srv": { type: "dir" },
    "/srv/fan-backups": { type: "dir" },
    "/srv/fan-backups/staging": { type: "dir" },
    "/home": { type: "dir" },
    "/home/devops": { type: "dir" },
    "/home/devops/.local": { type: "dir" },
    "/home/devops/.local/bin": { type: "dir" },
    "/root": { type: "dir" },
    "/root/root.txt": {
      type: "file",
      content: "flag{fansonly-root-compromise-simulated}\n"
    }
  };

  if (actor === "devops" || actor === "root") {
    files["/home/devops/notes.txt"] = {
      type: "file",
      content: "Remember to check /srv/fan-backups/staging after each packaging run.\n"
    };
  }

  return files;
}

function ensureStateFile() {
  const env = getEnv();
  fs.mkdirSync(path.dirname(env.statePath), { recursive: true });
  if (!fs.existsSync(env.statePath)) {
    fs.writeFileSync(env.statePath, JSON.stringify(defaultState(), null, 2));
  }
  fs.chmodSync(env.statePath, 0o666);
}

export function readChallengeState() {
  ensureStateFile();
  const env = getEnv();
  return JSON.parse(fs.readFileSync(env.statePath, "utf8"));
}

export function writeChallengeState(nextState) {
  const env = getEnv();
  fs.writeFileSync(env.statePath, JSON.stringify(nextState, null, 2));
  fs.chmodSync(env.statePath, 0o666);
}

export function resetChallengeState() {
  writeChallengeState(defaultState());
}

export function createShellSession(actor, source) {
  const state = readChallengeState();
  const token = crypto.randomBytes(12).toString("hex");
  state.shellSessions[token] = {
    actor,
    source,
    createdAt: new Date().toISOString()
  };
  state.shellSessionCounter += 1;
  writeChallengeState(state);
  return token;
}

export function getShellSession(token) {
  const state = readChallengeState();
  return state.shellSessions[token] || null;
}

export function getVirtualHost(actor) {
  const state = readChallengeState();
  return state.virtualHosts[actor];
}

export function updateVirtualHost(actor, updater) {
  const state = readChallengeState();
  const current = state.virtualHosts[actor];
  state.virtualHosts[actor] = updater(structuredClone(current));
  writeChallengeState(state);
  return state.virtualHosts[actor];
}
