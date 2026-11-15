# AstroVital v3: real backend, crew sign-in, per-astronaut data

```
backend/    Express + Prisma + Postgres API (also serves the frontend)
frontend/   login page + the four dashboard pages (static, no build)
```

## Run it (Windows/Mac/Linux, needs Node 20+ and Docker or a local Postgres 16)

1. `cd backend`
2. `docker compose up -d`          (starts Postgres; or point DATABASE_URL in `.env` at your own)
3. `npm install`
4. `npx prisma migrate deploy`
5. `npm run seed -- --reset`       (loads the mock pack, creates the demo accounts, prints their passcodes)
6. `npm run dev`  (or `npx tsx src/server.ts`)
7. Open **http://localhost:3000**

Demo accounts (printed by the seed; change them before any real use):

| Crew ID | Passcode           | Bio-Monitor pairing code |
|---------|--------------------|--------------------------|
| A01     | Artemis-A01-2026   | A01-PAIR-7391            |
| A02     | Artemis-A02-2026   | A02-PAIR-5528            |
| FS01    | Surgeon-FS01-2026  | (flight surgeon, reads any crew member) |
| ADMIN   | Admin-Console-2026 | (admin)                  |

Set `SIM_DEMO_EPISODES=true` in `.env` for more frequent abnormal episodes in a demo.

## What is now real

- **Accounts and sessions.** Crew ID + passcode (scrypt hashed), httpOnly session cookie (only a hash is stored), 12 h / 30 min idle expiry, lockout after 5 failures, rate limit, same error for unknown ID and wrong passcode, CSRF header + origin check.
- **Biometric.** Fingerprint / face via WebAuthn passkeys (user verification required). Register one on the Profile page, then use "Use fingerprint / face" on the login page. Needs `localhost` or HTTPS.
- **Data belongs to the astronaut.** Every record carries `astronautId`. An astronaut can only read their own profile, baseline, overview, stream, trends, events and connection status (403 otherwise, and the attempt is audited). Flight surgeons and admins can read any crew member.
- **Bio-Monitor verification.** After sign-in the astronaut enters the device pairing code. That opens a monitoring session `A01-D39` tying the device, the wearer and the mission day together. Readings are only accepted into an open session that matches the astronaut. Device gateways post with the `X-Device-Key` header (`DEVICE_API_KEY`).
- **Continuous stream.** While a session is open the simulated Bio-Monitor posts a reading every 5 s through the same ingest path as a real device. Gaps (app closed, sensor dropout) are back-filled. Each reading is judged against that astronaut's own baseline and stored; daily averages update for the Trends page.
- **Audit log.** Sign-ins, failures, denied access, passkey changes and monitor verification are recorded (shown on the Profile page).

## Tests

`TEST_DATABASE_URL=postgresql://.../hackbio_test npx vitest run` (121 tests, including auth, isolation, lockout, CSRF and monitor pairing).

## Hosting on Render (free) with Neon

1. Put this whole folder (`README.md`, `backend/`, `frontend/`, `render.yaml`) in a GitHub repo.
2. Render dashboard: **New + > Blueprint**, pick the repo. Render reads `render.yaml`.
3. When asked for `DATABASE_URL`, paste the Neon **pooled** connection string (Neon > Connect). Never commit it.
4. Deploy. The first start creates the tables, the demo crew and accounts, then fills the past mission days in the background (about a minute).
5. Open the URL Render shows. If it is not `https://hackbio-v3.onrender.com`, set `WEBAUTHN_RP_ID` (host only) and `WEBAUTHN_ORIGIN` (full https URL) to it in the Environment tab, then redeploy. Fingerprint sign-in needs these to match.

Free Render services sleep after 15 minutes without visits and take about a minute to wake. Change the demo passcodes before any real use.

If you serve the pages from VS Code Live Server (5500) instead, set `apiBaseUrl` in `frontend/js/config.js` to `http://localhost:3000` and add `http://localhost:5500` to `CORS_ORIGINS`; opening via port 3000 is simpler and is what passkeys are set up for.

## Live deployment (Vercel)

The `vercel/` folder is the deployable package (Root Directory = `vercel`). Set these environment variables: `DATABASE_URL` (Postgres, e.g. Neon), `SIM_LAZY=true`, `SIM_ENABLED=false`, `COOKIE_SECURE=true`, `PROTECTED_PAGES_DIR=protected`, `AUTO_SETUP=true` (first request creates tables, demo accounts and history; switch it off afterwards), plus `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN` and `CORS_ORIGINS` for your domain.
Demo login for judges is pre-filled: crew A01, pairing code `A01-PAIR-7391`. Change all demo passcodes before real use.
Heart rate and skin temperature thresholds are provisional (ISS-based), not from the proposal.
