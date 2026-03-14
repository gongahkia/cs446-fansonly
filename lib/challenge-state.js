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
    "/var/www/fan-store/.env": {
      type: "file",
      mode: "0640",
      content: [
        "SITE_NAME=FansOnly",
        "NEXT_PUBLIC_DEPRECATED_REACT=19.1.0",
        "NEXT_PUBLIC_DEPRECATED_NEXT=15.1.0",
        `DEVOPS_SSH_PASSWORD=${env.devopsPassword}`,
        `ADMIN_TOKEN=${env.adminToken}`
      ].join("\n")
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
}

export function readChallengeState() {
  ensureStateFile();
  const env = getEnv();
  return JSON.parse(fs.readFileSync(env.statePath, "utf8"));
}

export function writeChallengeState(nextState) {
  const env = getEnv();
  fs.writeFileSync(env.statePath, JSON.stringify(nextState, null, 2));
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
