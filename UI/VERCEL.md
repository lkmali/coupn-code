# Deploying the admin UI to Vercel

Only the Next.js app in `UI/` goes to Vercel. The Express API in `src/` stays on
your own server — it holds long-lived Mongo and Redis connections, runs
migrations at boot, discovers controllers by scanning directories at runtime,
and writes rotating log files, none of which survive on ephemeral serverless
functions.

Vercel serves the UI and proxies `/api/*` through to your backend, so the browser
only ever talks to one origin.

```
browser ──> https://<app>.vercel.app/login          (static export, from Vercel)
browser ──> https://<app>.vercel.app/api/auth/login (same-origin)
                     └─ Vercel edge rewrite ──> http://140.245.233.90:3000/api/auth/login
```

## One-time Vercel project setup

1. **Import the repo** at vercel.com → Add New → Project. This enables the Git
   integration: every push to the connected branch deploys automatically, and
   every PR gets a preview URL. No CI workflow or token is needed.
2. **Root Directory: `UI`.** This is the only required dashboard setting and it
   is not expressible in `vercel.json`. Without it Vercel reads the backend's
   root `package.json`, finds no Next.js, and the build fails.
3. Leave Framework (Next.js), Build Command, and Output Directory on their
   auto-detected defaults. `next.config.ts` sets `output: "export"`, which the
   Next.js builder handles on its own.
4. **Do not set `NEXT_PUBLIC_API_BASE_URL`.** See below.
5. Pick which branch is Production (Settings → Git → Production Branch). Your
   existing S3 workflow deploys `development`/`staging`/`production`; Vercel is
   independent of it and neither one disturbs the other.

## ⚠️ The backend has no TLS

`vercel.json` points the rewrite at `http://140.245.233.90:3000` — the value of
`BACKEND_URL` in `.env`, confirmed reachable (`/health` → 200). It is plain HTTP:
that host serves nothing on port 443.

The rewrite still works, because Vercel's edge makes that call server-side — the
browser only ever sees HTTPS, so there is no mixed-content error. But the
**Vercel edge → your server hop crosses the public internet unencrypted**, and
every JWT and login credential rides it in cleartext. Anyone on the path can read
them.

Put a TLS certificate on that host (a domain + Let's Encrypt, or a load balancer
that terminates TLS) and change the destination to `https://…`. Until then, treat
this deployment as insecure for real credentials.

Two other constraints worth knowing:

- **The destination must be publicly reachable.** The rewrite is resolved by
  Vercel's edge network, not the user's browser, so `localhost` or a private IP
  would not work. The Oracle Cloud IP above is public, which is why it does.
- **The value is hardcoded.** `vercel.json` does not interpolate environment
  variables, so preview and production deployments share one backend. If you
  later need them to differ, the way out is to drop the static export and move
  the rewrite into `next.config.ts`, where it can read `process.env`.

## Why `NEXT_PUBLIC_API_BASE_URL` must stay unset

[`lib/api.ts`](lib/api.ts) defaults the axios base URL to the relative path
`"/api"`, which is exactly what makes the rewrite work. Setting the env var on
Vercel would bake an absolute URL into the static bundle at build time, sending
the browser cross-origin and bypassing the proxy entirely — and since the backend
is HTTP-only, the browser would then block every call as mixed content.

The variable still exists for `next dev`, where the UI runs on its own port and
genuinely is cross-origin. Put it in `UI/.env.development`, never `.env.local`
(`.env.local` also applies to `next build` and would leak into the export).

## Backend changes to make before the first deploy

The proxy keeps the browser same-origin, but the backend still needs:

- **`ALLOWED_ORIGINS`** — add `https://<your-app>.vercel.app`. Same-origin POSTs
  still carry an `Origin` header, which Vercel forwards. Note this is currently
  unset in `.env`, so [`config.ts`](../src/config.ts) falls back to `['*']` and
  every origin is allowed. That is why CORS appears to work today; it is not a
  setting you want to keep in production.
- **`WEBSITE_URL`** — point at the Vercel domain so emailed links (password
  reset, etc.) resolve for users. It is currently `http://localhost:3000`.

`connectSrc` in [`src/config.ts:87`](../src/config.ts#L87) hardcodes localhost
origins and `http://140.245.233.90:3000`. That CSP only covers pages Express
serves, so it does not affect the Vercel deployment; the equivalent policy for
Vercel lives in `vercel.json` and drops those dev origins.

## Note on the repo's own build

The root `npm run build:all` **currently fails** — and so does `docker build`,
which runs it. This is unrelated to Vercel: `src/` is missing ~47 modules that it
imports (the whole `src/mcp/` tree, most Mongo models, and 11 of the 12
controllers that the stale `dist/` was built from), so `tsc` cannot compile the
server. The running backend at the IP above was built before those files went
missing.

`npm run build:ui` is unaffected and works, which is all Vercel needs — it builds
only from `UI/`.
