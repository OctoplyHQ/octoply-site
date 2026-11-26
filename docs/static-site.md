# Static Octoply site (`site/`)

A plain HTML/CSS/JS site for Octoply, hosted on Netlify. Jobs and
applications use Netlify Forms, and the privacy notice lives at `/privacy/`.
A news page and a CMS for news and other pages may be added later.

## Layout

```
site/
  index.html                       homepage
  projects/for-nh/index.html       project pages (clean URLs: /projects/for-nh/)
  projects/flo-ra/index.html
  projects/robins-hood/index.html
  privacy/index.html               privacy notice (draft for Octoply to review)
  thanks/index.html                shown after a form is sent without JavaScript
  404.html
  assets/css/site.css              the only stylesheet (contents list at the top)
  assets/js/site.js                header, hero fade, menu, reveals, sliders, gallery
  assets/js/apply.js               job application form (homepage only)
  assets/img/                      photos (1000px and 2000px hero) and RH screenshots (webp)
  assets/fonts/manrope-latin.woff2 Manrope variable font (200–800), Western European characters only
netlify.toml                       at the repo root: publishes site/, redirects, headers
```

There is no build step. Each page carries its own header and footer, so a
change to the menu or footer has to be made in every HTML file. CSS and JS
links end in `?v=<hash>`; when you edit `site.css`, `site.js` or `apply.js`,
change that value in every page (any new value works) or browsers keep the
old file for up to a year.

## Jobs

Roles are written into `index.html` (search for `class="role"`): copy or
delete a `<div class="role">` block to add or remove one. Applications are a
Netlify Form called `application`; each submission, with the CV attached,
appears in Netlify under Forms → application. Turn on email notifications
there. Netlify accepts up to 8 MB per submission, so the CV is capped at 7.5 MB.

## Contact form

A Netlify Form called `contact` (Forms → contact).

## Staff log in

The header's "Staff log in" goes to Robin's Hood for the Octoply organisation:
`https://app.r-hood.co/login?org=octoply&utm_source=octoply.co&utm_medium=website&utm_campaign=staff-login&utm_content=nav&utm_term=<page>`.
As of Nov 2026 the Robin's Hood login only reads `?view=forgot`; the other
parameters arrive but are ignored until the app is updated to use them.

## Font

`manrope-latin.woff2` is Manrope trimmed to Latin, Latin-1, smart quotes,
dashes, arrows, £ and € (22 KB instead of 155 KB). If the site ever needs
other characters, re-trim from the full Manrope font with fonttools:
`pyftsubset Manrope.ttf --unicodes=<ranges> --layout-features='*' --flavor=woff2`.

## Motion

The hero photos cross-fade as you scroll, sections fade in, and the Robin's
Hood screenshots cycle. All of it is switched off for visitors who ask their
device for reduced motion.

## Deploying

Netlify deploys this repository directly (it's public, so the free Netlify
plan can connect to it; no GitHub Actions or tokens are involved).

| Event | Result |
| --- | --- |
| Push to `release` | Production (the live site) |
| Push to `main` | Branch preview at `main--<site>.netlify.app` |
| Pull request | Deploy preview at `deploy-preview-<number>--<site>.netlify.app`, linked on the PR |

Previews and production share one Netlify site, so test form submissions from
a preview land in the same Forms inbox as real ones.

One-off setup, in the Octoply Netlify account, on the existing site:

1. Project configuration → Build & deploy → Continuous deployment → Link
   repository → GitHub → `OctoplyHQ/octoply-site`. If GitHub asks, allow the
   Netlify app access to that repository (an organisation owner may need to
   approve it).
2. Production branch: `release`. Branch deploys: add `main`. Deploy previews:
   on for pull requests.
3. Leave the build command empty; the publish directory comes from
   `netlify.toml` (`site`).
4. Turn off the Netlify badge and turn on form notifications.

## Launch on octoply.co

Canonical links, `sitemap.xml`, `robots.txt`, share-image URLs and the
organisation data on the homepage all use `https://octoply.co`. To go live:

1. In Netlify, add `octoply.co` as the primary domain and `octoply.com` /
   `www.octoply.com` as domain aliases, then point DNS at Netlify.
2. Turn off visitor access (the password) in Netlify. The preview-only
   `X-Robots-Tag` line has already been removed from `netlify.toml`.
3. Switch on email notifications for the `application` and `contact` forms.
4. Submit `https://octoply.co/sitemap.xml` in Google Search Console.

### Icons and sharing

| File | Used by |
| --- | --- |
| `site/favicon.ico` (16 to 48px) and `site/icon.svg` | Browser tabs and bookmarks |
| `site/apple-touch-icon.png` (180px) | iPhone and iPad home screens, and apps that look for it at the root |
| `site/site.webmanifest` with `assets/img/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Android home screens |
| `site/assets/img/share.jpg` (1200 by 630) | Link previews on LinkedIn, WhatsApp, Slack and so on, via `og:image` |

### Old addresses (redirects in netlify.toml)

| Old octoply.com address | Goes to |
| --- | --- |
| any path on octoply.com / www.octoply.com | same path on octoply.co, then the rules below |
| `/octoply` | `/` |
| `/robinshood`, `/robinshood/*` | `/projects/robins-hood/` |
| `/robinshood/privacypolicy`, `/privacypolicy`, `/jobapplications/privacypolicy` | `/privacy/` |
| `/jobapplications`, `/jobapplications/*` | `/#jobs` |
| `/jobapplications/admin/*` | `/` |
| anything else that no longer exists | the 404 page |
