# FansOnly Training VM

This repository contains a safe classroom simulation of the FansOnly vulnerable-organization brief. The public-facing story matches the assignment narrative, while shell access, privilege escalation, and internal pivots are sandboxed inside a controlled training layer.

## What is implemented

- A Next.js storefront with the exact legacy-version banner, `/new-site`, `/backup`, `/admin`, and `robots.txt` hints.
- A public export route at `/internal/exports/users.csv`.
- A public Server Action flow at `/legacy-preview` that simulates dropping a `www-data` reverse-shell callback when challenge-style payloads are submitted.
- A webhook tester with the required documentation text and a loopback token service simulation for analyst onboarding.
- An internal admin API bound to `127.0.0.1:4000` for the analyst-to-admin training path.
- A restricted SSH login for `devops` that opens a fake shell instead of the host OS.
- Simulated wildcard-injection and PATH-hijack privilege-escalation paths inside the fake shell.

## Local development

```bash
npm install
npm run seed
npm run dev
```

The app defaults to local data under `./var`. For a VM deployment, run [`install.sh`](/Users/gongahkia/Desktop/coding/projects/cs446-redteam/install.sh) as root on Ubuntu 22.04.
