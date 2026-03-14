# VM Validation Checklist

Run this immediately after:

```bash
sudo bash install.sh
```

on the professor VM.

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

- `users.csv` contains `devops` and password `123456`

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

## 9. Confirm frontend still responds after reset

```bash
curl http://127.0.0.1/robots.txt
```

## Optional Full Smoke Test

In a browser:

1. Open `http://<vm_ip>/tools/webhook-test`
2. Fetch `http://127.0.0.1:9000/bootstrap`
3. Create an analyst account at `/account/analyst-signup`
4. Open `/legacy-preview`
5. Submit:

```json
{"mode":"preview","cmd":"bash -c 'id'"}
```

6. Confirm `/console` opens

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
