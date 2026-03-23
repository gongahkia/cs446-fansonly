# VM Validation Checklist

Run this immediately after:

```bash
sudo bash install.sh
```

on the professor VM.

Assumptions:

- Ubuntu Server 22.04
- outbound internet available for `apt` and `npm`
- you have a user with `sudo`

## 1. Confirm services are up

```bash
sudo systemctl status fansonly-app fansonly-admin-api fansonly-token nginx ssh --no-pager
```

## 2. Confirm listening ports

```bash
ss -ltnp | egrep ':(22|80|3000|4000|9000)\b'
```

Expected:

- `22` and `80` reachable
- `3000`, `4000`, and `9000` bound to `127.0.0.1`

## 3. Confirm public recon artifacts

```bash
curl http://127.0.0.1/robots.txt
curl http://127.0.0.1/assets/site-notes.js
curl http://127.0.0.1/internal/exports/users.csv
```

Expected:

- `robots.txt` lists `/backup/`, `/admin/`, and `/internal/exports/`
- `site-notes.js` contains:

```js
// TODO: remove debug exports at /internal/exports/users.csv
```

- `users.csv` contains `devops` and an MD5 password hash in the `password_md5` column
- with the default install values, the hash is `e10adc3949ba59abbe56e057f20f883e`
- the intended student solve is to crack that hash offline with `john` or `hashcat` using `rockyou.txt`, then SSH as `devops`

## 4. Confirm webhook/token path

```bash
curl -X POST http://127.0.0.1/api/webhook/test \
  -H 'Content-Type: application/json' \
  -d '{"targetUrl":"http://127.0.0.1:9000/bootstrap"}'
```

Expected:

- response JSON contains `adminToken`

## 5. Confirm home page banner

```bash
curl -s http://127.0.0.1/ | grep -E 'react@19.1.0|next@15.1.0'
```

Expected:

- output includes both `react@19.1.0` and `next@15.1.0`

## 6. Confirm restricted SSH works

```bash
ssh devops@127.0.0.1
```

Password:

```text
123456
```

Expected:

- the prompt starts with `devops@fansonly:`
- this is the restricted training shell, not a normal host shell

If you are validating the intended student path for Vector 1, recover `123456` from the leaked MD5 hash in `users.csv` first, then use it for SSH.

## 7. Confirm simulated host artifacts inside SSH shell

Run:

```bash
pwd
cat /etc/cron.d/fansonly-backup
cat /usr/local/sbin/fansonly-maintenance.sh
exit
```

## 8. Confirm reset works cleanly

```bash
sudo bash reset-state.sh
```

Expected:

- the app database is reseeded
- `users.csv` is recreated
- fake shell sessions and root-escalation progress are cleared
- file ownership remains consistent for the app services because the reset runs as `www-data`

## 9. Confirm frontend still responds after reset

```bash
curl http://127.0.0.1/robots.txt
```

## 10. Remove the original source checkout if you want no extra hints on disk

The deployed app tree at `/var/www/fan-store` is intended to be runtime-only. `install.sh` excludes `docs/`, git metadata, the local Playwright folder, and the installer itself from that deployed copy.

If you copied the repo onto the VM only to run the installer, remove that original source checkout after the checks above pass so it does not leave extra docs or repo history on disk. Example:

```bash
rm -rf /home/<vm_user>/cs446-fansonly
```

## Optional Full Smoke Test

In a browser:

1. Open `http://<vm_ip>/tools/webhook-test`
2. Fetch `http://127.0.0.1:9000/bootstrap`
3. Create an analyst account at `/account/analyst-signup`
4. Open `/legacy-preview`
5. Submit:

```text
bash -c "id"
```

6. Confirm the page shows reverse-shell callback drop status and does not open an interactive browser shell

The `Action payload` field currently executes the raw submitted command. Do not wrap the value in JSON for this smoke test.

## If Something Fails

App logs:

```bash
sudo journalctl -u fansonly-app -n 100 --no-pager
```

Admin API logs:

```bash
sudo journalctl -u fansonly-admin-api -n 100 --no-pager
```

Token service logs:

```bash
sudo journalctl -u fansonly-token -n 100 --no-pager
```

Nginx config check:

```bash
sudo nginx -t
```

Restart everything:

```bash
sudo systemctl restart fansonly-token fansonly-admin-api fansonly-app nginx ssh
```
