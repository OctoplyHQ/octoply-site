# Octoply

The octoply.co website: a static HTML/CSS/JS site in `site/`, hosted on
Netlify, with forms handled by Netlify Forms. There is no build step.

## Branches

| Branch | What it's for | Deploys to |
|---|---|---|
| `main` | Day-to-day work. Pull requests go here. | Preview: `main--<site>.netlify.app`; each pull request gets `pr-<number>--<site>.netlify.app` |
| `release` | What's live. Update it only from `main`, once a change has been checked on the preview. | Production (octoply.co) |

To release: open a pull request from `main` into `release` and merge it, or
`git push origin main:release` once `main` is ready.

Deploys run in GitHub Actions (`.github/workflows/deploy-site.yml`). Setup,
launch steps and the old-URL redirect table are in `docs/static-site.md`.
