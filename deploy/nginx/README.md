# Nginx config for degry-121.ru

This folder contains the ready Nginx config for the VM.

## Install on Ubuntu VM

From the project root on the VM:

```bash
sudo cp deploy/nginx/default /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## What this config fixes

- `https://degry-121.ru/` opens the React app from `/home/degry121/diplom-zxc-1.0/klining/dist`.
- `https://degry-121.ru/admin` keeps working with React Router.
- `https://degry-121.ru/api/...` is proxied to the backend on `http://127.0.0.1:3010`.
- HTTP port `80` redirects to HTTPS.
- Certbot SSL paths for `degry-121.ru` and `www.degry-121.ru` are preserved.

If Certbot created a different certificate folder, replace:

```nginx
/etc/letsencrypt/live/degry-121.ru/
```

with the actual folder name from:

```bash
sudo ls /etc/letsencrypt/live/
```
