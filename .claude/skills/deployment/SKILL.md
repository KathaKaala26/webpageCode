---
name: deployment
description: Use whenever changes in this repo are ready to be committed and/or deployed — "deploy", "push this live", "ship it", or any request to commit+push. Keeps the two git remotes (origin and kathakaala) in sync and triggers the Vercel auto-deploy. Always invoke before pushing, even if the user only says "deploy".
---

# Deploying katha-and-kala

This repo has **two git remotes that must always stay in sync**:

| Remote | URL | Role |
|---|---|---|
| `origin` | https://github.com/SuniketSolutions/KalaaandKathaa.git | Primary working repo |
| `kathakaala` | https://github.com/KathaKaala26/webpageCode.git | Wired to the GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs `vercel deploy --prod` on every push to `main` |

**Every commit must be pushed to both remotes, every time** — not just `kathakaala`. Never push to only one.

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
5. The push to `kathakaala` triggers `.github/workflows/deploy.yml`, which runs `vercel deploy --prod` using the `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` GitHub secrets (documented in this repo's `README.md`). No separate deploy step is needed — pushing to `kathakaala` *is* the deploy.
6. If you want to confirm the deploy, check the Actions tab on `https://github.com/KathaKaala26/webpageCode` or the Vercel dashboard — the CLI (`gh`) is not available in this environment, so this is a manual check if needed.

## Why this matters

Without step 2–3, a push can silently overwrite a commit made directly on one remote (e.g. a quick price fix pushed straight to `kathakaala`), permanently losing it. Without pushing to both remotes in step 4, the two repos drift apart again and a future session will hit the same divergence this skill was created to prevent.
