# Blue Team Operator Guide

This repository is a safe classroom simulation of the `FansOnly` scenario. It is designed to preserve the narrative and user flow of your assignment while keeping RCE, SSH pivoting, SSRF, and privilege escalation inside a controlled training layer rather than exposing the actual Ubuntu host.

Do not describe this to the professor or other teams as a real vulnerable production stack. The accurate description is:

- the website and attack narrative match the brief;
- the attacker experience is intentionally reproduced;
- the dangerous parts are simulated so the VM remains safe to host in class.

## Deployment On The Professor VM

Assumptions:

- Ubuntu Server 22.04
- outbound internet available for `apt` and `npm`
- you have a user with `sudo`

### 1. Copy the repo to the VM

From your own machine:

```bash
scp -r /path/to/cs446-redteam <vm_user>@<vm_ip>:/home/<vm_user>/cs446-redteam
```

If the repo is already on the VM, skip this step.

### 2. SSH into the VM

```bash
ssh <vm_user>@<vm_ip>
cd /home/<vm_user>/cs446-redteam
```

### 3. Run the installer

```bash
sudo bash install.sh
```

What `install.sh` does:

- installs `nginx`, `openssh-server`, `sqlite3`, `build-essential`, `rsync`, and Node.js 20 if missing;
- copies the repo into `/var/www/fan-store`;
- creates the Linux user `devops`;
- sets the `devops` password to `123456`;
- writes `/var/www/fan-store/.env`;
- installs dependencies with `npm ci` when `package-lock.json` is present;
- seeds the SQLite database and `users.csv` as `www-data`;
- builds the Next.js app as `www-data`;
- creates and enables:
  - `fansonly-app.service`
  - `fansonly-admin-api.service`
  - `fansonly-token.service`
- configures nginx to proxy public traffic to `127.0.0.1:3000`;
- configures ssh so logging in as `devops` opens the restricted training shell;
- runs health checks against nginx, the Next app, the localhost admin API, and the token service before finishing.

### 4. Verify the deployment

Run these checks on the VM:

```bash
sudo systemctl status fansonly-app fansonly-admin-api fansonly-token nginx ssh --no-pager
curl http://127.0.0.1/robots.txt
curl http://127.0.0.1/internal/exports/users.csv
curl -X POST http://127.0.0.1/api/webhook/test \
  -H 'Content-Type: application/json' \
  -d '{"targetUrl":"http://127.0.0.1:9000/bootstrap"}'
ss -ltnp | egrep ':(22|80|3000|4000|9000)\b'
```

Expected result:

- `22` and `80` are externally reachable;
- `3000`, `4000`, and `9000` are loopback-only;
- `robots.txt` lists `/backup/`, `/admin/`, and `/internal/exports/`;
- `/internal/exports/users.csv` returns the seeded CSV;
- the webhook test returns a JSON object containing the bootstrap token.

### 5. Reset between red-team attempts

After one team finishes, reset state:

```bash
sudo bash reset-state.sh
```

This reseeds:

- the app database;
- the export CSV;
- the fake shell state;
- simulated root-escalation progress.

Use the reset before each group. Some paths persist challenge state otherwise.
The reset now runs as `www-data` so file ownership stays consistent for the app services.

## Requirement Mapping

This section maps your requested scenario to the current implementation as it exists in this repo.

### Recon

Requested:

- sensitive directories discovered through `robots.txt`

Implemented:

- exact `robots.txt` entries:
  - `/backup/`
  - `/admin/`
  - `/internal/exports/`

Status:

- matched

### Initial Access Vector 1: IDOR -> devops SSH

Requested:

- attacker finds `/internal/exports/users.csv`
- CSV leaks developer credentials
- attacker SSHs in as `devops`
- hint in source comment: `// TODO: remove debug exports at /internal/exports/users.csv`

Implemented:

- `/internal/exports/users.csv` is publicly downloadable;
- `public/assets/site-notes.js` contains the exact comment;
- CSV includes `devops` and password `123456`;
- `ssh devops@<vm_ip>` works after deployment.

Important note:

- this SSH session is intentionally forced into `/usr/local/bin/fansonly-shell-cli`, which is a simulated shell, not the real host shell.

Status:

- narrative matched
- host compromise simulated

### Initial Access Vector 2: React RCE via Server Actions

Requested:

- real `react@19.1.0` and `next@15.1.0`
- real CVE-2025-55182 exploitation
- reverse shell as `www-data`

Implemented:

- the home page banner explicitly references `react@19.1.0` and `next@15.1.0`;
- `/new-site` exists and is under construction;
- `/legacy-preview` contains a public Server Action flow;
- submitting a challenge-style payload unlocks `/console`, which is a simulated `www-data` shell with access to a fake `/var/www/fan-store/.env`.

Important note:

- the installed runtime is not the real vulnerable stack;
- this is the main intentional deviation for safety;
- the red team still experiences the exact story beat: React/Server-Action clue -> shell as `www-data` -> read `.env`.

Status:

- narrative matched
- real CVE exploitation simulated

### Initial Access Vector 3: SSRF -> ADMIN_TOKEN -> analyst account

Requested:

- webhook testing SSRF to `127.0.0.1:9000`
- token exposed
- token used to create analyst account

Implemented:

- `/docs/webhook` contains the exact hint text you requested;
- `/tools/webhook-test` posts to `/api/webhook/test`;
- entering `http://127.0.0.1:9000/bootstrap` returns the bootstrap token;
- `/account/analyst-signup` accepts that token and creates an analyst account.

Important note:

- only the classroom bootstrap service is reachable through this path;
- this is a safe SSRF simulation, not unrestricted server-side fetching of arbitrary internal targets.

Status:

- narrative matched
- SSRF simulated

### Horizontal Escalation 1: www-data -> devops via `.env`

Requested:

- `.env` reveals reused SSH password

Implemented:

- the simulated `www-data` shell can read `/var/www/fan-store/.env`;
- `.env` includes `DEVOPS_SSH_PASSWORD=123456`;
- the same password works for `ssh devops@<vm_ip>`.

Status:

- matched

### Horizontal Escalation 2: analyst -> admin through internal API

Requested:

- internal Admin API
- attacker with a normal account can promote themselves

Implemented:

- localhost-only admin service listens on `127.0.0.1:4000`;
- it accepts any valid session token and does not check for admin role;
- the simulated `www-data` shell can call it and promote the analyst user to admin.

Status:

- matched

### Vertical Escalation 1: wildcard injection

Requested:

- root backup process uses `tar *`
- writable backup directory

Implemented:

- the fake shell includes `/srv/fan-backups/staging`;
- the shell exposes a cron file showing `tar ... *`;
- creating specially named files triggers a simulated escalation from `devops` to `root`.

Important note:

- this does not execute anything on the real Ubuntu host;
- it only upgrades the attacker inside the training shell.

Status:

- narrative matched
- root escalation simulated

### Vertical Escalation 2: PATH privilege escalation

Requested:

- privileged script calls binaries without absolute paths

Implemented:

- the fake shell exposes `/usr/local/sbin/fansonly-maintenance.sh`;
- the script sets `PATH=/home/devops/.local/bin:...`;
- planting `du` or `find` in `/home/devops/.local/bin` triggers a simulated root escalation.

Status:

- narrative matched
- root escalation simulated

## What You Should Tell The Professor

Use wording like this:

`We implemented a safe training VM that reproduces the exact recon, initial-access, lateral-movement, and privilege-escalation narrative from our scenario. The website, routes, credentials, internal services, and attacker flow all match the brief. For safety, the high-risk elements such as the React RCE and Linux root escalation are simulated rather than exposing the real host OS.`

That statement is accurate.

## Useful Operator Commands

Check services:

```bash
sudo systemctl status fansonly-app fansonly-admin-api fansonly-token nginx ssh --no-pager
```

Restart everything:

```bash
sudo systemctl restart fansonly-token fansonly-admin-api fansonly-app nginx ssh
```

View app logs:

```bash
sudo journalctl -u fansonly-app -f
sudo journalctl -u fansonly-admin-api -f
sudo journalctl -u fansonly-token -f
```

Reset challenge state:

```bash
sudo bash reset-state.sh
```

## Important Caveat

If your assignment is graded on shipping real exploitable vulnerabilities, this repo does not do that. It is a controlled simulation that preserves the scenario and walkthrough.
