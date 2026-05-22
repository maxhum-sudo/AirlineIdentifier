# Deploy Airline Guess with Leaderboard

This app is a Vite frontend plus two serverless API routes:

- `POST /api/scores` — validates and stores a completed game
- `GET /api/leaderboard` — returns top scores

Recommended hosting: **Vercel + Neon Postgres**.

## What you need before starting

- A GitHub account
- A [Vercel](https://vercel.com) account
- A [Neon](https://neon.tech) account
- Your game assets committed, especially `public/airlines/tailpins/` (~100MB)

The leaderboard will not save scores until `DATABASE_URL` is configured.

---

## Step 1: Commit and push the repo

```bash
git add .
git commit -m "Add leaderboard API and deployment config"
git remote add origin https://github.com/<your-user>/AirlineIdentifier.git
git push -u origin main
```

Use your actual branch name if it is not `main`.

---

## Step 2: Create the Neon database

1. Sign in to [Neon](https://neon.tech)
2. Create a new project, for example `airline-guess`
3. Open **Connection details**
4. Copy the **pooled** Postgres connection string
5. It should look like:

```text
postgres://user:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require
```

You do not need to run a migration manually. The API creates the `scores` table on first use.

---

## Step 3: Deploy to Vercel

1. Sign in to [Vercel](https://vercel.com)
2. Click **Add New → Project**
3. Import your GitHub repo
4. Keep the defaults:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Open **Environment Variables**
6. Add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | your Neon connection string |

7. Deploy

Vercel will build the frontend into `dist/` and deploy the API routes from `api/`.

---

## Step 4: Verify production

After deploy finishes:

1. Open your Vercel URL, for example `https://airline-identifier.vercel.app`
2. Play a full 5-round game
3. On the results screen, enter a display name and click **Submit score**
4. Confirm the score appears in the leaderboard panel
5. Test a challenge link like `?challenge=ABC123`
6. Switch the leaderboard tab to **Challenge** and confirm challenge-specific scores appear

If submission fails with “Leaderboard is not configured yet”, the `DATABASE_URL` env var is missing or was added after deploy. Add it in Vercel and redeploy.

---

## Step 5: Local development with the leaderboard

1. Copy env vars:

```bash
cp .env.example .env
```

2. Paste your Neon `DATABASE_URL` into `.env`

3. Start the app:

```bash
npm install
npm run dev
```

The Vite dev server serves `/api/scores` and `/api/leaderboard` locally through the plugin in `server/localApiPlugin.ts`.

Optional: test with the production-like Vercel CLI flow:

```bash
npx vercel dev
```

---

## Step 6: Custom domain (optional)

1. In Vercel, open **Project → Settings → Domains**
2. Add your domain
3. Update DNS as instructed by Vercel
4. No code changes are needed if the app is served from the domain root

---

## GitHub Pages note

GitHub Pages can still host the static frontend, but it cannot run the leaderboard API or connect to Neon by itself.

If you want both frontend and leaderboard online, use Vercel instead of GitHub Pages.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes, for leaderboard | Neon Postgres connection string |
| `CURSOR_API_KEY` | No for gameplay | Only used by local tailpin generation scripts |

---

## Troubleshooting

### Images do not load online

Make sure `public/airlines/tailpins/` is committed and pushed. The game uses those PNGs in production.

### Score submit returns 400

The server re-validates every answer from the challenge seed. That usually means the submitted game does not match the challenge code or mode.

### Leaderboard empty but submit works

Refresh after submitting. The results screen refreshes the board automatically after a successful post.

### API works locally but not on Vercel

Check Vercel **Project → Settings → Environment Variables** and confirm `DATABASE_URL` exists for Production, then redeploy.

---

## Architecture summary

```text
Browser
  ├─ static game assets from Vercel CDN
  ├─ POST /api/scores
  └─ GET /api/leaderboard
        └─ Neon Postgres
```

Score validation happens server-side by rebuilding the question set from the challenge seed and recalculating points, so clients cannot post fake high scores without matching real answers.
