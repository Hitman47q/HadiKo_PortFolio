# Hadi Korish — Portfolio

React + Vite site on **Cloudflare Pages** (free plan). The API lives in `functions/` (Pages Functions) and uses
the **D1** database for everything, including images and the CV uploaded from **`/admin`**.
Everything is set up from the Cloudflare dashboard — no Wrangler, no R2, no paid plan needed.

```
src/site/      public site (hero, work, contact…)      src/admin/   /admin dashboard (separate chunk)
src/i18n.js    English / Arabic text                    functions/   API: /api/* and /media/*
migrations/    SQL to paste into the D1 console         server/      shared server code (auth)
```

## One-time setup in the Cloudflare dashboard

The `functions/` folder only runs when Pages builds the site **from GitHub**
(drag-and-drop uploads of `dist` skip it). Pushing to `main` deploys.

1. **D1 → `portfolio-db` → Console**: paste everything from `migrations/0002_admin_upgrade.sql` and run it **once**.
   It only adds columns and tables; existing projects and visitors are kept. The file has no `--` comments on
   purpose: the console joins lines together, so a comment would swallow everything after it.
   It adds case-study fields to `projects`, plus `messages`, `testimonials`, `settings`, `media` (uploaded files)
   and `login_failures` (login rate limit).
2. **Workers & Pages → `hadiko-portfolio` → Settings**
   - **Build:** build command `npm run build`, output directory `dist`.
   - **Bindings → Add → D1 database:** variable name `DB` → `portfolio-db`.
   - **Variables and Secrets → Add** (type *Secret*): `ADMIN_PASSWORD` = your new admin password,
     `SESSION_SECRET` = any long random string.
3. Push to GitHub (or **Retry deployment**) so the binding and secrets apply, then open `/admin`.
4. Once `/admin` works, delete the old `hadi-portfolio-api` Worker.

## Message notifications (optional, free)

Add these as **Secrets** in the Pages project (same place as `ADMIN_PASSWORD`), redeploy, then use
**/admin → Settings → Send test notification**. You can set up one or both.

**Telegram (instant push on your phone)**
1. In Telegram, message **@BotFather** → `/newbot` → follow the steps. Copy the token it gives you → secret `TELEGRAM_BOT_TOKEN`.
2. Open your new bot and press **Start** (send it any message).
3. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates` in your browser and copy `"chat":{"id": …}` → secret `TELEGRAM_CHAT_ID`.

**Email (via resend.com, free tier)**
1. Sign up at resend.com → **API Keys → Create** → secret `RESEND_API_KEY`.
2. Secret `NOTIFY_EMAIL` = the **same email you signed up to Resend with** (without your own domain, Resend only delivers to that address).
   Hitting **Reply** answers the visitor directly.

## Local development

`npm run dev` serves the site on http://localhost:5173 and borrows the **live** site's API, so projects,
logins and `/admin` changes there use your real data. Until the setup above is deployed, the Work section
locally will show "Projects couldn't load".

## Day to day

- Add / edit / reorder projects, testimonials and the CV at `/admin`.
- Uploaded images are shrunk in the browser (max 1600px, WebP) so they fit D1's 2 MB limit; CV PDFs must be under 1.9 MB.
- Tall screenshots are shown in a phone frame automatically.
- Videos are too big for the database: put short clips in `public/videos/` and paste `/videos/name.mp4`
  as the project's preview video — they play silently on hover.
- Contact-form messages appear under **Messages** in `/admin`.
