# 🚀 Publishing Singlescan Online — Deployment Guide

The app is a **Next.js 16 standalone server + SQLite database + in-memory matching queue**.
This means: it must run as a **single long-lived process on a machine with a persistent disk**.
It does **NOT** fit Vercel's serverless model as-is (see Option D).

---

## ✅ Recommended: Railway (easiest, ~10 minutes)

1. Push this project to a GitHub repo:
   ```bash
   cd /home/z/my-project
   git init && git add -A && git commit -m "Singlescan app"
   git remote add origin https://github.com/<you>/singlescan.git
   git push -u origin main
   ```
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
   Railway auto-detects the `Dockerfile` and builds it.
3. Add a **Volume**: Service → Variables/Settings → "Volumes" → mount at `/app/db`.
4. Set variable `DATABASE_URL=file:/app/db/custom.db`.
5. Deploy → you get a public HTTPS URL like `https://singlescan.up.railway.app`.
6. Add your custom domain in Settings → Domains (optional).

## ✅ Render (also easy)

1. Push to GitHub (same as above).
2. [render.com](https://render.com) → **New → Web Service** → connect repo → Runtime **Docker**.
3. Add a **Disk** (1 GB) mounted at `/app/db`.
4. Env var `DATABASE_URL=file:/app/db/custom.db`.
5. Create → public URL: `https://<your-app>.onrender.com`.

## ✅ Your own VPS (DigitalOcean / Hetzner / EC2)

```bash
# on the server (Docker installed)
git clone https://github.com/<you>/singlescan.git
cd singlescan
docker compose up -d --build
```
Then put Caddy or Nginx in front for HTTPS:
```bash
# Caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}
```

## 🧪 Test the production build locally first

```bash
docker compose up --build
# open http://localhost:3000
```

---

## ❌ Why not Vercel (as-is)?

| Constraint | Problem on Vercel |
|---|---|
| SQLite file DB | Serverless functions have no persistent disk — the DB resets constantly |
| In-memory matching queue (`global.__singlesRt`) | Each function invocation may run in a different container — users would never match |
| SSE live chat (`/api/chat/events`) | Needs a long-lived connection; serverless has strict timeouts |

To use Vercel you'd have to migrate to **Postgres (Neon/Supabase)** + **Pusher/Ably** for realtime.
Possible later upgrade, but not required for launch.

---

## ⚠️ Architecture notes

- **One instance only**: the waiting queue / online list / live sessions live in RAM.
  Scale vertically (bigger box), not horizontally (multiple replicas).
- **Data location**: everything persists in `/app/db/custom.db` on the mounted volume.
- **Backups**: copy that file periodically (`sqlite3 custom.db ".backup backup.db"`).

## 📋 Go-live checklist

- [x] 18+ age confirmation (built into the start screen)
- [x] Secure session cookies (httpOnly, 30 days)
- [ ] HTTPS (Railway/Render give it automatically; add Caddy/Nginx on a VPS)
- [ ] Add a Privacy Policy + Terms page (required for a public social/dating site)
- [ ] Set up DB backups
- [ ] Optional: report/block user features, rate limiting before open launch
