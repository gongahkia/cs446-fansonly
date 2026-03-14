import fs from "node:fs";
import path from "node:path";
import { ensureDataDirs, getEnv } from "../lib/env.js";
import { initDb, resetUsers, upsertMeta } from "../lib/db.js";
import { resetChallengeState } from "../lib/challenge-state.js";

function runSeed() {
  const env = getEnv();
  ensureDataDirs();
  initDb();

  resetUsers([
    {
      email: "buyer@fansonly.local",
      password: "deskfan123",
      role: "customer"
    }
  ]);

  upsertMeta("site_name", env.siteName);
  upsertMeta("admin_token", env.adminToken);
  upsertMeta("deprecated_react", "19.1.0");
  upsertMeta("deprecated_next", "15.1.0");

  fs.mkdirSync(env.exportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(env.exportsDir, "users.csv"),
    [
      "name,system_username,password,role,notes",
      `Leo Marsh,devops,${env.devopsPassword},linux-admin,"legacy wholesale deployment user"`
    ].join("\n")
  );

  resetChallengeState();
}

runSeed();
