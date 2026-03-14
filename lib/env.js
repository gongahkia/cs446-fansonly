import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const dataDir = process.env.FANSONLY_DATA_DIR || path.join(rootDir, "var");
const dbPath = process.env.FANSONLY_DB_PATH || path.join(dataDir, "fansonly.db");
const exportsDir = path.join(dataDir, "exports");
const statePath = path.join(dataDir, "challenge-state.json");

export function ensureDataDirs() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(exportsDir, { recursive: true });
}

export function getEnv() {
  ensureDataDirs();

  return {
    appJwtSecret: process.env.APP_JWT_SECRET || "fansonly-dev-secret",
    adminToken: process.env.ADMIN_TOKEN || "WW-ANALYST-BOOTSTRAP-2026",
    dataDir,
    dbPath,
    exportsDir,
    statePath,
    siteName: process.env.SITE_NAME || "FansOnly",
    devopsPassword: process.env.DEVOPS_SSH_PASSWORD || "123456"
  };
}
