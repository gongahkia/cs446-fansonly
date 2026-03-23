# FansOnly Training VM

This repository contains the FansOnly training VM for the classroom scenario. The public-facing story matches the assignment narrative, the browser shell route is disabled, and the SSH, internal-service, and privilege-escalation paths are routed through controlled training services and a restricted shell.

## What is implemented

- A Next.js storefront with the exact legacy-version banner, `/new-site`, `/backup`, `/admin`, and `robots.txt` hints.
- A public export route at `/internal/exports/users.csv` that leaks a crackable MD5 hash for the `devops` credential.
- A public Server Action flow at `/legacy-preview` that accepts raw command payloads while keeping browser-interactive shell access disabled.
- A webhook tester with the required documentation text and a loopback token service simulation for analyst onboarding.
- An internal admin API bound to `127.0.0.1:4000` for the analyst-to-admin training path.
- A restricted SSH login for `devops` that opens a fake shell instead of the host OS.
- Simulated wildcard-injection and PATH-hijack privilege-escalation paths inside the fake shell.
- An Ubuntu deployment flow in `install.sh` that provisions nginx, SSH, the Next.js app, the internal admin API, and the bootstrap token service.
- A reset flow in `reset-state.sh` that reseeds the database, export CSV, and training-shell state between attempts.

## Local development

```bash
npm install
npm run seed
npm run dev
```

These commands only start the Next.js app. The full analyst-to-admin path also depends on the two localhost services:

```bash
node services/token-service.mjs
node services/admin-api.mjs
```

The app defaults to local data under `./var`.

For VM deployment, run `sudo bash install.sh` from the repo root on Ubuntu 22.04 with outbound `apt` and `npm` access and a user with `sudo`. The installer copies the repo into `/var/www/fan-store`, creates the `devops` account, writes `.env`, builds the app as `www-data`, enables `fansonly-app`, `fansonly-admin-api`, and `fansonly-token`, and configures nginx plus restricted SSH access for `devops`.
