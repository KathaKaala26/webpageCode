---
name: deployment
description: Use whenever changes in this repo are ready to be committed and/or deployed — "deploy", "push this live", "ship it", or any request to commit+push. Keeps the two git remotes (origin and kathakaala) in sync and triggers the Vercel auto-deploy. Always invoke before pushing, even if the user only says "deploy".
---

# Deploying katha-and-kala

This repo has **two git remotes that must always stay in sync**:

| Remote | URL | Role |
|---|---|---|
| `origin` | https://github.com/SuniketSolutions/KalaaandKathaa.git | Primary working repo. |
| `kathakaala` | https://github.com/KathaKaala26/webpageCode.git | Client-owned repo — push access only, no admin/web access to it. Carries the same workflow file. |

Both repos carry valid secrets for the same Vercel project (`katha-and-kala`) as of 2026-11-08, so both deploy the same commit on every push — no `if:` guard anymore.

**Every commit must be pushed to both remotes, every time** — not just `kathakaala`. Never push to only one.

## ⚠️ Mid-migration to Cloudflare Workers (see `C:\Users\Subhasis\.claude\plans\eventual-strolling-nygaard.md`)

`.github/workflows/deploy.yml` currently runs **two** jobs on every push to `main`: `deploy-vercel` (the original, still live/primary) and `deploy-cloudflare` (new, transitional — deploys to a Cloudflare Worker via `@opennextjs/cloudflare` + `wrangler deploy`). Both jobs need their own secrets on **both** `origin` and `kathakaala` — `deploy-cloudflare` additionally needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the app secrets listed in the migration plan's env-var table. Until the migration's cutover phase is verified complete (custom domain attached, Vercel decommissioned), **Vercel is still the one serving real production traffic** — the Cloudflare job is for building up and testing the new deploy path in parallel, not yet the source of truth. Once cutover is verified, `deploy-vercel` should be removed and this doc rewritten to drop Vercel entirely.

## Procedure

1. Make and commit your changes on `main` as usual (see repo's own commit conventions — new commits, not amends, unless told otherwise).
2. **Before pushing**, fetch both remotes and check for divergence — another session or a teammate may have committed directly to either repo:
   ```
   git fetch origin main
   git fetch kathakaala main
   git merge-base --is-ancestor origin/main main && echo "origin OK" || echo "origin DIVERGED"
   git merge-base --is-ancestor kathakaala/main main && echo "kathakaala OK" || echo "kathakaala DIVERGED"
   ```
3. If either shows **DIVERGED**, do not force-push. Inspect what's different first:
   ```
   git log --oneline main..<remote>/main
   ```
   Merge the remote's unique commits into local `main` (`git merge <remote>/main --no-edit`), resolve any conflicts, re-run `npm run typecheck`, and only then proceed. This has happened before (a price edit was made directly on `kathakaala` outside of this workflow) — treat any divergent commit as real work to preserve, not noise to discard.
4. Push to **both** remotes:
   ```
   git push origin main
   git push kathakaala main
   ```
5. The push to `origin` triggers `.github/workflows/deploy.yml` there, which runs both the `deploy-vercel` job (`vercel deploy --prod` using the `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` GitHub secrets, documented in this repo's `README.md`) and, mid-migration, the `deploy-cloudflare` job (see the warning above). No separate deploy step is needed — pushing to `origin` *is* the deploy. The same push to `kathakaala` fires the same two jobs there too.
6. If you want to confirm the deploy, check the Actions tab on `https://github.com/SuniketSolutions/KalaaandKathaa` or the Vercel dashboard. `gh` is not available in this environment; `vercel ls` / `vercel inspect <url>` (the CLI is installed and already authenticated) work for a manual check.

## Why this matters

Without step 2–3, a push can silently overwrite a commit made directly on one remote (e.g. a quick price fix pushed straight to `kathakaala`), permanently losing it. Without pushing to both remotes in step 4, the two repos drift apart again and a future session will hit the same divergence this skill was created to prevent.
