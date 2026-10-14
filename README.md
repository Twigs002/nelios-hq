# Nelio's HQ

Private, mobile-first seller follow-up tool for **Nelio Mendes**, Quay 1 International
Realty. Built to the locked design system (`DESIGN.md`, Quay 1 brand, light only) and run on
Vercel's free Hobby plan.

> Seller data is personal information under POPIA. The app is allowlist-only, has no
> analytics or third-party scripts, and never logs names or phone numbers.

## Demo vs real app
The public demo runs with **no external services**: an in-memory PGlite database
pre-seeded with fictional sellers (`DEMO_DB=true`), and an open password-less
sign-in (`AUTH_DEV_LOGIN=true`) that offers fake personas, never the real
allowlist. The dev sign-in only activates against an embedded database (demo or
local PGlite), never a Neon deployment, so it can't become a back door to real
data. **Keep the demo and the real (Neon) app as separate Vercel projects.**

## Stack
- Next.js 16 (App Router, TypeScript), Tailwind v4, self-hosted Montserrat (Gotham stand-in).
- Neon Postgres (free) + Drizzle ORM with migrations. Local/demo can use embedded PGlite.
- Auth.js (NextAuth v5) Google sign-in, allowlisted by `ALLOWED_EMAILS`.
- AI CMA assistant via the Anthropic API (`claude-opus-4-8`), gated by `ANTHROPIC_API_KEY`.
- Timezone Africa/Johannesburg, currency ZAR (en-ZA).

## Local setup
1. `npm install`
2. Copy env: `cp .env.example .env.local` and fill in (see **Environment** below).
3. Create the schema: `npm run db:migrate` (or `npm run db:push` for a quick sync).
4. Seed fictional data: `npm run db:seed`.
5. `npm run dev` and open http://localhost:3000.

## Environment variables
See `.env.example` for the full list and a one-line description of each. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Neon pooled (runtime) / direct (migrations). |
| `AUTH_SECRET` | Auth.js secret (`npx auth secret`). |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth client. |
| `AUTH_URL` | App origin for OAuth callbacks. |
| `ALLOWED_EMAILS` | Comma-separated sign-in allowlist. |
| `SYNC_CALENDAR` / `CALENDAR_DRY_RUN` / `GOOGLE_CALENDAR_ID` | Calendar sync (Phase 5). |
| `SLACK_WEBHOOK_URL` / `DIGEST_DRY_RUN` / `CRON_SECRET` | Morning digest (Phase 6). |
| `ANTHROPIC_API_KEY` | Enables the AI CMA draft. Absent (e.g. demo) = drafting is disabled gracefully. |
| `DEMO_DB` / `DB_DRIVER` / `AUTH_DEV_LOGIN` | Demo/local: in-memory or disk PGlite, and the password-less dev sign-in. |
| `TZ` | `Africa/Johannesburg`. |

## Setup services
- **Neon** - add the Neon integration in the Vercel dashboard; it sets `DATABASE_URL` and
  `DATABASE_URL_UNPOOLED`. Then run `npm run db:migrate`.
- **Google OAuth** - Google Cloud Console → APIs & Services → Credentials → OAuth client ID
  (Web). Authorised redirect URI: `{AUTH_URL}/api/auth/callback/google`. Scopes stay minimal
  (`openid email profile` + `calendar.events`).
- **Slack** - create an incoming webhook and set `SLACK_WEBHOOK_URL` (digest is dry-run by
  default).

## Features
- **Today** - follow-ups due today and overdue, one-tap WhatsApp or Done.
- **Board** - every seller; mobile cards / desktop table; search + code + due filters.
- **Seller detail** - valuation, next follow-up (reschedule), facts, contact history.
- **Quick add** - add a seller and set the first follow-up in seconds.
- **Follow-up engine** - the seller code drives the cadence; due dates never land on a
  weekend or SA public holiday; marking done logs the contact and schedules the next.
- **WhatsApp** - pick a template, fill placeholders, preview/edit, open a `wa.me` link.
  Nelio sends it himself. No API, nothing auto-sent.
- **Google Calendar sync** - behind `SYNC_CALENDAR` (off) + `CALENDAR_DRY_RUN` (on); preview
  exactly what would change before enabling. `calendar.events` scope only.
- **Morning digest** - weekday 07:00 SAST Slack summary (dry-run by default, skips holidays).
- **AI CMA assistant** - on a seller's CMA page, draft a valuation from the comparable
  sales (`cma/` methodology, `claude-opus-4-8`). It only proposes; nothing is written
  until Nelio applies it. On the demo (no key) a local sample estimate stands in.
- **Valuation snapshot** - comparable sales (manual + CSV paste) → branded 1080×1350 PNG + PDF.
- **Settings** - "Confirm with Nelio" banner + per-group confirm toggles for all placeholders.
- **PWA** - installable on the iPhone home screen; offline shell (never caches seller data).

## Scripts
- `npm run dev` / `build` / `start`
- `npm test` - Vitest (follow-up date logic: cadence, weekends, 2026/2027 holidays)
- `npm run db:generate` - generate a migration from the schema
- `npm run db:migrate` - apply migrations
- `npm run db:push` - push schema directly (dev)
- `npm run db:seed` - seed fictional sellers + templates + settings

## Testing
`npm test` runs the Vitest suite. The follow-up engine (`lib/followup.ts`), view decorator and
formatters are covered, including weekend and public-holiday roll-forward for 2026 and 2027.

## Deployment (Vercel Hobby)
1. Push the repo and import the project in Vercel. If the app is a subdirectory, set the
   **Root Directory** to `nelios-hq`.
2. Add the **Neon** integration (sets `DATABASE_URL` + `DATABASE_URL_UNPOOLED`), then run
   `npm run db:migrate` against it and `npm run db:seed` once (fictional data).
3. Set every env var from `.env.example` in the Vercel project (Production + Preview).
4. In Google Cloud, add the deployed callback to the OAuth client:
   `https://<your-domain>/api/auth/callback/google`, and set `AUTH_URL` to the domain.
5. The cron in `vercel.json` (`0 5 * * 1-5`) is picked up automatically; Vercel provides
   `CRON_SECRET` to the request. Keep `DIGEST_DRY_RUN=true` until you are ready to post.
6. Leave `SYNC_CALENDAR=false` / `CALENDAR_DRY_RUN=true` until you have previewed a sync.

Build must pass locally first (`npm run build`). **Never** deploy to production from
automation - run `vercel --prod` yourself.

## Privacy (POPIA)
Seller data is personal information. No analytics or third-party scripts; the app does not log
names or phone numbers; the service worker never caches seller data; every route and server
action re-checks the allowlist. Keep all secrets in env vars.

## Project layout
- `app/` - routes and screens.
- `db/` - Drizzle schema, client, migrations, seed.
- `lib/` - domain logic: `codes` (seller codes + marks), `format` (ZAR/dates/phone),
  `followup` (cadence + weekend/holiday engine), `cma/` (CMA context + draft + demo),
  auth/session helpers.
- `cma/` - the AI CMA methodology Claude follows (block + street/full-title), editable
  without code changes; data-source notes (cmainfo.co.za pending).
- `config/` - `nelio-brief` (placeholder brief, confirm flags), `sa-holidays` (2026 and 2027).
- `public/brand/` - Quay 1 logos.
