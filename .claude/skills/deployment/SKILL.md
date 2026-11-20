---
name: deployment
description: Use whenever changes in this repo are ready to be committed and/or deployed — "deploy", "push this live", "ship it", or any request to commit+push. Keeps the two git remotes (origin and kathakaala) in sync and triggers the Cloudflare Worker auto-deploy that actually serves kathakaala.com. Always invoke before pushing, even if the user only says "deploy".
---

# Deploying katha-and-kala

This repo has **two git remotes that must always stay in sync**:

| Remote | URL | Role |
|---|---|---|
| `origin` | https://github.com/SuniketSolutions/KalaaandKathaa.git | Primary working repo. |
| `kathakaala` | https://github.com/KathaKaala26/webpageCode.git | Client-owned repo — push access only, no admin/web access to it. Carries the same workflow file. |

Both repos carry valid secrets for the same Vercel project (`katha-and-kala`) as of 2026-11-08, so both deploy the same commit on every push — no `if:` guard anymore.

**Every commit must be pushed to both remotes, every time** — not just `kathakaala`. Never push to only one.

## ✅ Cutover complete: Cloudflare Workers is production

`.github/workflows/deploy.yml` runs **two** jobs on every push to `main`: `deploy-cloudflare` (deploys to a Cloudflare Worker via `@opennextjs/cloudflare` + `wrangler deploy`) and `deploy-vercel` (the original path, kept as a rollback safety net). As of 2026-11-20, `kathakaala.com` / `www.kathakaala.com` are confirmed pointed at the **Cloudflare Worker** — verify with `curl -sI https://kathakaala.com` and look for `Server: cloudflare` / `x-opennext: 1`. **`deploy-cloudflare` is the job that matters for "is this live yet" — a green `deploy-vercel` run proves nothing about what users actually see.** Both jobs need their own secrets on **both** `origin` and `kathakaala` — `deploy-cloudflare` additionally needs `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the app secrets listed in the migration plan's env-var table (`C:\Users\Subhasis\.claude\plans\eventual-strolling-nygaard.md`). Do not remove `deploy-vercel` without explicit instruction — it's the rollback path if Cloudflare ever needs to be backed out.

### ⚠️ Known flaky failure: Postgres connection-pool exhaustion

`deploy-cloudflare`'s build step statically prerenders pages (home, shop/[slug], puja-essentials, books, more-about-us, sitemap) against a **direct** Postgres connection (`DIRECT_URL`), whose pool is capped at 15 clients. This intermittently fails with:
```
ConnectorError ... (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
```
**If you see this, do not immediately rerun the job** — a build that dies mid-way leaks its Postgres connections (the process exits before Prisma disconnects), so an immediate retry has even less pool headroom and tends to fail *faster* than the last attempt (observed: first failure died on a shop page, an immediate retry died on `/` itself). And **never rerun the same commit's `deploy-cloudflare` job on both remotes at the same time** — that doubles the concurrent connection load and is what caused this in the first place.

Recovery: wait several minutes (so Postgres/Supabase can time out the orphaned sessions) or have someone terminate stale sessions in the Supabase/Postgres dashboard, then retry **one remote at a time**, waiting for each to finish before touching the other.

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
5. The push to `origin` triggers `.github/workflows/deploy.yml` there, which runs both the `deploy-cloudflare` job (`wrangler deploy`, the one that actually serves `kathakaala.com` — see the warning above) and the `deploy-vercel` job (`vercel deploy --prod`, kept as a rollback safety net). No separate deploy step is needed — pushing to `origin` *is* the deploy. The same push to `kathakaala` fires the same two jobs there too.
6. To confirm the deploy actually reached the live site, check `deploy-cloudflare` specifically, not just "did the workflow go green":
   ```
   gh auth status                           # gh IS installed and authenticated in this environment
   gh run list --repo SuniketSolutions/KalaaandKathaa --branch main --limit 3
   gh run view <run-id> --repo SuniketSolutions/KalaaandKathaa --json jobs \
     -q '.jobs[] | select(.name=="deploy-cloudflare") | "\(.status) \(.conclusion)"'
   ```
   Do the same against `KathaKaala26/webpageCode` for the `kathakaala` remote's run — both repos run their own copy of the workflow. Then verify against the live domain itself:
   ```
   curl -sI https://kathakaala.com        # expect Server: cloudflare, x-opennext: 1
   curl -s https://kathakaala.com/<path> | grep -o '<marker text from the change>'
   ```
   `vercel ls` / `vercel inspect <url>` (CLI installed and authenticated) still works for checking the Vercel safety-net deploy, but a green Vercel deploy does **not** mean the change is live — see the warning above.

## Why this matters

Without step 2–3, a push can silently overwrite a commit made directly on one remote (e.g. a quick price fix pushed straight to `kathakaala`), permanently losing it. Without pushing to both remotes in step 4, the two repos drift apart again and a future session will hit the same divergence this skill was created to prevent.
