# Docker + Nginx VPS deployment

This project runs on port `2124` in Docker and Nginx proxies your domain to it.

## 1) Copy project to VPS

```bash
git clone <your-repo-url> wbwaserver
cd wbwaserver
```

Create `.env` on the VPS. Do **not** commit it:

```env
PORT=2124
HOST=0.0.0.0
API_KEY=change-me
SESSIONS_DIR=/app/sessions
LOG_LEVEL=info
SESSION_STALE_HOURS=24
REDIS_URL=redis://...
```

## 2) Build and run Docker

```bash
docker compose up -d --build
docker compose logs -f wbwaserver
```

Check locally on the VPS:

```bash
curl http://127.0.0.1:2124/health
```

## 3) Configure Nginx

Copy the example config:

```bash
sudo cp deploy/nginx-wbwaserver.conf /etc/nginx/sites-available/wbwaserver
sudo nano /etc/nginx/sites-available/wbwaserver   # change api.example.com to your domain
sudo ln -s /etc/nginx/sites-available/wbwaserver /etc/nginx/sites-enabled/wbwaserver
sudo nginx -t
sudo systemctl reload nginx
```

## 4) Enable HTTPS

After your domain DNS points to the VPS:

```bash
sudo certbot --nginx -d your-domain.com
```

## Useful commands

```bash
docker compose ps
docker compose logs -f wbwaserver
docker compose restart wbwaserver
docker compose down
```
