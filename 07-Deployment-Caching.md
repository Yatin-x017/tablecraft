# TableCraft — Deployment & Caching Guide

| Field | Value |
|---|---|
| Version | 1.0 |
| Date | August 13, 2026 |
| Applies to | `vercel.json`, hosting cache-control headers |
| Chunk strategy | Named `manualChunks` in `vite.config.ts` + Vite content hashing |

---

## Why caching matters here

Every build emits **content-hashed** files in `/assets/` — the filename changes only when
the file's contents change:

```
react-DWDgpVZn.js        react + react-dom + scheduler
motion-C0VPq-3X.js       motion + motion-dom + motion-utils
router-CrImb524.js       react-router + react-router-dom
validation-BUo-Nkr1.js    zod
state-hKNnee-t.js        zustand
anime-CLLkx5R5.js        animejs (on-demand)
emailjs-DQQHQCMM.js      @emailjs/browser (on-demand)
index-DgqkjRbG.js        app shell (main entry)
```

Because the hash is derived from the file's contents, an asset can be cached **forever**
(immutable): if the code changes, the hash changes, the browser requests a *new* URL, and
the old cached copy is never served stale. Nothing ever needs "busting".

The one exception is `index.html` (no hash) — it must be revalidated on every visit so
visitors pick up the newest hashed asset URLs.

## The strategy in one line

> `/assets/*` → `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable` (1 year, never revalidated)
>
> `index.html` → `Cache-Control: public, max-age=0, must-revalidate` (revalidate every visit)

`vercel.json` in the repo root already encodes this (see below).

---

## Vercel (primary — see Implementation Plan §Phase 0)

`vercel.json` ships with the repo:

```json
{
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, s-maxage=31536000, immutable" }]
    },
    {
      "source": "/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    }
  ]
}
```

Notes:
- The `/assets/(.*)` rule wins over the catch-all because Vercel evaluates header
  rules in array order (first match wins) and the assets rule is listed first.
- The rewrite is the SPA fallback: deep links (`/book`, `/admin`) serve `index.html`.
- `s-maxage` makes the CDN (edge cache) and browser share the same 1-year policy, so a
  cached asset is served from the edge without revalidation. Vercel does not inject this
  for you — it caches static files based on the `Cache-Control` you set.
- No `headers` config is needed for the app shell beyond the catch-all above.

## Netlify

`netlify.toml` (or `_headers` + `_redirects`):

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Cloudflare Pages

`public/_headers`:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*
  Cache-Control: public, max-age=0, must-revalidate
```

SPA fallback is configured in the Pages dashboard (Single-page application: On) or a
`_redirects` file with `/* /index.html 200`.

## Generic static host (nginx)

```nginx
location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}

location / {
    add_header Cache-Control "public, max-age=0, must-revalidate";
    try_files $uri /index.html;
}
```

Apache: equivalent `mod_headers` `Header set Cache-Control ...` with `ExpiresActive`
or `<FilesMatch>` rules on `/assets/`.

---

## Gotchas

1. **Never set `immutable` on `index.html`.** It has no content hash; a 1-year immutable
   cache on it would pin visitors to an old build indefinitely.
2. **Don't cache `/assets/` with `no-store` or short `max-age`.** That throws away the
   whole point of content hashing — every visit re-downloads ~440 kB of eager vendor JS
   (react, motion, router, state, index) plus the page chunks on top.
3. **Service workers (if added later)** must always fetch `index.html` with
   `cache: "no-store"` or network-first, then cache the hashed assets it references.
4. **Supabase/EmailJS env vars do not affect hashing** — but if you add a `.env` with
   `VITE_SUPABASE_URL`, a new `supabase-*.js` chunk appears on the next build. No config
   change needed; it's already covered by the `/assets/*` rule.

---

## Verifying

After deploy, curl the live URL (Vercel + your site domain). Grab the exact hashed
filename from a local build first — the hash changes every build:

```bash
npm run build
ls dist/assets/ | grep '^react-'          # e.g. react-DWDgpVZn.js

curl -sI https://<your-domain>.vercel.app/assets/react-DWDgpVZn.js | grep -i cache-control
# expect: cache-control: public, max-age=31536000, s-maxage=31536000, immutable

curl -sI https://<your-domain>.vercel.app/ | grep -i cache-control
# expect: cache-control: public, max-age=0, must-revalidate
```

The hashes shown in the chunk list above are from one specific build and change on the
next one — always read the actual filenames from `ls dist/assets/`.

Locally, `vite preview` doesn't emit these headers — the config applies only on the
hosting platform. To sanity-check locally, build then inspect the emitted filenames:

```bash
npm run build
ls dist/assets/*.js   # every file has a content hash; index.html references them
```
