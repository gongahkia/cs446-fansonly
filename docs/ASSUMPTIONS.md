# Assumptions and Current Gaps

This repository is close to the original proposal at the narrative level, but not at the literal implementation level.

The largest assumption in the current codebase is that a safe simulation is acceptable in place of real vulnerable behavior. That is true for most of the repo and is explicitly how the project is currently built.

## Fully or Mostly Matched

- `robots.txt` exposes `/backup/`, `/admin/`, and `/internal/exports/`.
- `/internal/exports/users.csv` exists and leaks `devops` credentials.
- The source comment hint for `/internal/exports/users.csv` exists in `public/assets/site-notes.js`.
- The home page includes the deprecated-version banner and links to a stub `/new-site`.
- The webhook docs and tester support the intended analyst-bootstrap story.
- The `.env` reuse story exists inside the simulated `www-data` shell.
- Both intended `devops -> root` narratives exist: wildcard injection and PATH hijack.

## Missing or Not Literal

### 1. React RCE is not actually implemented

- The repo does not run the proposed vulnerable stack.
- `package.json` is pinned to `react@19.1.0` and `next@15.1.0` to match the scenario banner, but there is no real CVE exploitation in this safe build.
- The `/legacy-preview` path does not exploit a real CVE. It checks the submitted payload pattern and marks a simulated reverse-shell callback as dropped.

Impact:

- The story beat exists, but the proposal's "real exploit against the pinned vulnerable versions" is not present.

### 2. The `www-data` reverse-shell step is non-interactive in the web app

- Browser shell interaction is disabled, including `/api/shell`.
- The attacker does not get a real shell on the host and does not get real access to `/var/www`; the challenge still uses simulated filesystem entries for safety.

Impact:

- The repository keeps the reverse-shell storyline but intentionally avoids browser-interactive command execution.

### 3. The internal admin API is present, but discoverability is weak

- The vulnerable admin role-changing endpoint exists in `services/admin-api.mjs`.
- It accepts any valid session token and does not verify that the caller is already an admin.
- However, there is no strong attacker-facing clue that points users toward `127.0.0.1:4000/users/:id/role`.

Impact:

- Horizontal Esc Path 2 exists mechanically, but it is not surfaced as clearly as the proposal suggests.

### 4. Admin compromise has limited visible payoff

- The analyst account can be promoted to `admin`.
- The account page reflects the new role.
- The `/admin` page itself is still a static placeholder and does not expose meaningful admin functionality.

Impact:

- The repo supports "role becomes admin", but not "gains full SaaS application control" in a convincing product sense.

### 5. Both vertical privesc paths are simplified state transitions

- The fake shell exposes a cron file containing `tar ... *` and a maintenance script with an unsafe `PATH`.
- Escalation happens because `lib/shell-engine.js` detects crafted filenames or planted binaries and flips the current actor from `devops` to `root`.
- There is no realistic simulated execution of the cron job or privileged script beyond that state change.

Impact:

- The narratives exist, but the implementation is still a controlled shortcut rather than a believable OS-level exploitation flow.

## Partial Gaps

### 6. SSRF is extremely narrow

- `/api/webhook/test` only meaningfully handles one exact URL: `http://127.0.0.1:9000/bootstrap`.
- Everything else returns a stubbed training response.

Impact:

- The SSRF path works for the intended exercise, but it is not a general localhost SSRF primitive.

### 7. The `.env` hint is only partially represented

- The attacker can read a simulated `.env` from the fake `www-data` environment.
- The proposal hint mentions web-server configuration and accidentally exposed configuration material, but the repo does not strongly model that discovery path.

Impact:

- The password-reuse pivot exists, but the supporting hint structure is thinner than the proposal.

### 8. Local development instructions do not bring up the full scenario

- `README.md` documents `npm install`, `npm run seed`, and `npm run dev`.
- The full analyst-to-admin path also depends on the token service and internal admin API.

Impact:

- The repo is easiest to understand when deployed through `install.sh`; local development only starts the Next.js app unless the extra services are run separately.

## Bottom Line

If the requirement is "match the proposal's attacker story", the repo is already close.

If the requirement is "literally build the vulnerable product described in the proposal", the main missing pieces are:

- a real vulnerable React/Next stack for the Server Actions path;
- a real or more realistic `www-data` shell experience;
- clearer discoverability for the localhost admin API;
- a more meaningful post-compromise admin surface;
- more realistic execution for the privesc chains.
