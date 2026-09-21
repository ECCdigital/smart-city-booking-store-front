# Smart City Booking — Storefront

![Nuxt](https://img.shields.io/badge/Nuxt-blue)
![Vue.js](https://img.shields.io/badge/Vue.js-blue)
![Node.js](https://img.shields.io/badge/Node.js-blue)
![npm](https://img.shields.io/badge/npm-blue)
![Docker](https://img.shields.io/badge/Docker-blue)

**[Smart City Booking](https://smart-city-booking.de/)** makes your administration's offerings bookable online — from rooms and sports facilities to makerspaces. Operated and developed by the Biletado core team. Open source, GDPR-compliant, and ready to deploy.

This repository contains the **public storefront** (Nuxt 4 / Vue 3). Server routes under `/api/*` act as a BFF proxy to the backend API and store auth tokens in HTTP-only cookies. It is only compatible with the **v4.x** backend and admin UI (see [Ecosystem](#ecosystem)).

---

## Ecosystem

| Component | Repository | Role |
|-----------|------------|------|
| **Backend API** | [smart-city-booking-backend](https://github.com/ECCdigital/smart-city-booking-backend) | REST API, auth, bookings, tenants |
| **Storefront** | [smart-city-booking-store-front](https://github.com/ECCdigital/smart-city-booking-store-front) | Public booking UI — connects to the API (v4) **(this repository)** |
| **Admin UI** | [smart-city-booking-vue-app](https://github.com/ECCdigital/smart-city-booking-vue-app) | Administration, configuration, and JS web interface for embedding |

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Storefront    │────▶│    Backend API       │◀────│    Admin UI     │
│  (this repo)    │     │  (backend repository)│     │   (vue-app)     │
└─────────────────┘     └──────────┬───────────┘     └─────────────────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │ MongoDB │
                              └─────────┘
```

> **v3 users:** Continue on branch `version/3.x` in the backend and admin UI repositories. v3 typically uses the vue-app for both admin and public flows. v4 introduces this separate storefront for public booking.

More details: [smart-city-booking-backend/docs/architecture.md](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/architecture.md)

---

## Versions & Branches

This repository has its **own release line** (currently **v1.x**). It requires the **v4.x** backend API and admin UI — there is no v3 storefront.

| Branch | Version line | Purpose |
|--------|--------------|---------|
| `develop` | **v1.x** (latest) | Active development and integration |
| `version/1.x` | **v1.x** (stable) | Maintenance, security fixes, production tag source |

| Backend / Admin UI | Storefront |
|--------------------|------------|
| v3.x (`version/3.x`) | Not supported — use the admin UI for public booking |
| v4.x (`develop` / `version/4.x`) | Supported (this repository) |

- v1.x releases: tags `v1.x.x` from `version/1.x`
- Breaking API changes: [smart-city-booking-backend/docs/CHANGELOG.md](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/CHANGELOG.md)

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v22.22.2+ (CI tests 22.x; the production image is `node:22-slim`)
- [npm](https://www.npmjs.com/) v10+
- [Docker](https://www.docker.com/) v20+ (optional, for container deployments)
- A running **[v4.x backend API](https://github.com/ECCdigital/smart-city-booking-backend)** instance

### Installation

```bash
git clone https://github.com/ECCdigital/smart-city-booking-store-front.git
cd smart-city-booking-store-front
npm install
cp .env.example .env
```

Configure at minimum the following values in `.env`:

```bash
NUXT_API_BASE_URL=http://localhost:8080
NUXT_USER_BASE_URL=http://localhost:3000
NUXT_PUBLIC_USER_BASE_URL=http://localhost:3000
NUXT_CACHE_ENABLED=false
```

Start the development server (backend must be running):

```bash
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000) with hot-reload enabled.

---

## Configuration

Create a `.env` file in the project root by copying the provided example:

```bash
cp .env.example .env
```

Nuxt maps `runtimeConfig` fields to `NUXT_*` environment variables. Values with the `NUXT_PUBLIC_` prefix are exposed to the browser. Server-side variables are applied at build time or on server start.

| Variable | Required | Description | Example |
| -------- | -------- | ----------- | ------- |
| `NUXT_API_BASE_URL` | **Yes** | Base URL of the backend API (server-side) | `https://api.booking.example.com` |
| `NUXT_PUBLIC_API_BASE_URL` | No | Public backend URL, if needed by the client | `https://api.booking.example.com` |
| `NUXT_USER_BASE_URL` | **Yes** | Public URL of this storefront (auth emails, server-side) | `https://booking.example.com` |
| `NUXT_PUBLIC_USER_BASE_URL` | **Yes** | Same URL for client-side redirects (e.g. password reset) | `https://booking.example.com` |
| `NUXT_ADMIN_BASE_URL` | No | Admin portal URL (server-side) | `https://admin.booking.example.com` |
| `NUXT_PUBLIC_ADMIN_BASE_URL` | No | Admin portal link in navigation (users with memberships); needed for the Live Preview of the Hero, which only this origin may frame (`/preview/hero` answers 404 without it) | `https://admin.booking.example.com` |
| `NUXT_PUBLIC_SILENT_SSO_ENABLED` | No | `true` enables automatic SSO check on page load (Keycloak) | `false` |
| `NUXT_CACHE_ENABLED` | No | `false` disables the server-side SWR cache of release-free answers (recommended for local dev); tenants and offers are never cached, see [Server-Side Cache](#server-side-cache) | `false` |
| `LOG_LEVEL` | No | Pino log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal` | `info` |
| `PORT` | No | HTTP port in Docker/production | `3000` |
| `NODE_ENV` | – | `development` or `production` (controls e.g. the `secure` flag on cookies) | `production` |

A complete overview with comments is available in [`.env.example`](.env.example).

### Example: Production

```bash
NUXT_API_BASE_URL=https://api.booking.example.com
NUXT_USER_BASE_URL=https://booking.example.com
NUXT_PUBLIC_USER_BASE_URL=https://booking.example.com
NUXT_PUBLIC_ADMIN_BASE_URL=https://admin.booking.example.com
NUXT_PUBLIC_SILENT_SSO_ENABLED=true
NUXT_CACHE_ENABLED=true
LOG_LEVEL=info
PORT=3000
NODE_ENV=production
```

---

## Features

| Area | Description |
| --- | --- |
| **Catalog** | Browse booking offers (bookables, events), search by location/time range, tenant-specific catalogs |
| **Checkout** | Multi-step booking flow including time selection, contact details, payment, and confirmation |
| **My Account** | Booking overview, invoices, favorites, mobile keys, settings |
| **Authentication** | Email/password, SSO (Keycloak), card login, silent SSO |
| **Theming** | Tenant-specific CSS, logo, and hero images via backend configuration |
| **Internationalization** | German (default) and English |

---

## Architecture

```
Browser  →  Storefront (Nuxt SSR / Nitro)  →  Backend API (v4.x)
              /api/*  (BFF proxy)                REST API
```

- **Frontend**: Nuxt 4 with SSR, Pinia state, Nuxt UI, i18n (de/en)
- **Server**: Nitro (`node-server` preset) — sensitive API calls run server-side
- **Backend**: Separate service — must be reachable at `NUXT_API_BASE_URL`
- **Multi-tenant**: Routes under `/t/:tenantID/...` are automatically derived from the standard routes

---

## Available npm Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Dev server with hot-reload |
| `npm run build` | Production build (Nitro `node-server` preset) |
| `npm run preview` | Local production preview |
| `npm run generate` | Static site generation |
| `npm run lint:check` | ESLint — report problems |
| `npm run release:patch` | Bump patch version |
| `npm run release:minor` | Bump minor version |
| `npm run release:major` | Bump major version |
| `npm run release:rc` | Create release candidate |

---

## Production

For backend deployment (Docker, secrets, process management, reverse proxy), see [smart-city-booking-backend/docs/deployment.md](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/deployment.md).

### Build

```bash
npm run build
npm run preview   # optional: test locally
```

The build produces a Nitro bundle under `.output/`, started with `node .output/server/index.mjs`.

### Docker

**Build the image:**

```bash
docker build -t smart-city-booking-store-front .
```

**Run the container:**

```bash
docker run -d \
  --name store-front \
  -p 3000:3000 \
  -e NUXT_API_BASE_URL=https://api.booking.example.com \
  -e NUXT_USER_BASE_URL=https://booking.example.com \
  -e NUXT_PUBLIC_USER_BASE_URL=https://booking.example.com \
  -e NUXT_PUBLIC_ADMIN_BASE_URL=https://admin.booking.example.com \
  -e NUXT_CACHE_ENABLED=true \
  -e LOG_LEVEL=info \
  smart-city-booking-store-front
```

Pre-built images are published to GHCR on GitHub release (`ghcr.io/eccdigital/smart-city-booking-store-front`). See `.github/workflows/docker-publish.yml`.

### Typical deployment

```
┌─────────────────────┐     ┌──────────────────────────────┐
│  Reverse Proxy      │     │  smart-city-booking-backend  │
│  (nginx / Traefik)  │────▶│  ghcr.io/.../backend         │
│                     │     └──────────────────────────────┘
│  booking.example.com│              ▲
│        │            │              │ NUXT_API_BASE_URL
│        ▼            │     ┌────────┴─────────────────────┐
│  store-front :3000  │────▶│  ghcr.io/.../store-front     │
└─────────────────────┘     └──────────────────────────────┘
```

Both containers should be on the same network; the reverse proxy terminates TLS and forwards to port `3000`.

### Tenant supervision rollout

Tenant supervision (blocked tenants, approved offers) ships as one cutover of backend, Admin UI and storefront; the backend's `docs/tenant-supervision-cutover.md` is the runbook. The storefront's part:

1. **Deploy matching versions.** This storefront release belongs to the backend release with tenant supervision. An older storefront keeps catalog bundles for up to 300 s and must not serve traffic after the cutover.
2. **Restart every storefront process.** The old bundle cache lives in process memory only — no Nitro storage or cache driver is configured (`nuxt.config.js`), nothing is written to disk or Redis — so it dies with the process. Replace or restart all replicas; do not leave an old one behind the load balancer.
3. **Purge CDN and reverse-proxy caches** for `/api/**` and the HTML pages. From this release on the release-carrying answers are sent with `Cache-Control: no-store` (see [Server-Side Cache](#server-side-cache)); entries stored before it have to be discarded once.
4. **`NUXT_CACHE_ENABLED`** needs no change. It no longer covers the catalog bundles, which are never cached; it only switches the cache of `/api/catalog/mode` and the Theme Bundle revalidation interval.

After that, a block or a withdrawn approval shows on the next request. A page that is already open is not refreshed live; every new detail page entry, checkout entry and booking attempt is checked against the backend.

---

## Operations

### Health & availability

- The app listens on `PORT` (default `3000`).
- Ensure the backend is reachable at `NUXT_API_BASE_URL` — without the backend, catalog, checkout, and auth will not work.
- Set `NUXT_USER_BASE_URL` / `NUXT_PUBLIC_USER_BASE_URL` to the publicly reachable URL (including scheme, no trailing slash) so auth links in emails are correct.

### Logging

Server logs are written via **Pino**. Control the log level with `LOG_LEVEL`:

```bash
LOG_LEVEL=debug   # Development / troubleshooting
LOG_LEVEL=warn    # Production with less noise
```

### Cookies & HTTPS

In `NODE_ENV=production`, auth cookies are set with the `Secure` flag. The storefront must therefore run behind HTTPS.

### SSO / Keycloak

- SSO endpoints: `/api/auth/sso/*`
- Silent SSO (`NUXT_PUBLIC_SILENT_SSO_ENABLED=true`) checks on the first page load whether a Keycloak session exists.
- Keycloak configuration is done in the backend/instance setup, not in the storefront.

### Scaling

- Stateless Nitro server — horizontally scalable behind a load balancer.
- The server-side SWR cache (`NUXT_CACHE_ENABLED`) is local per instance (LRU) and holds release-free answers only (portal mode). Tenants and offers are never cached, so replicas cannot disagree about a block or an approval.

### Release versioning

```bash
npm run release:patch    # Patch release
npm run release:minor    # Minor release
npm run release:major    # Major release
npm run release:rc       # Release candidate
```

Published GitHub releases trigger the Docker build workflow (`.github/workflows/docker-publish.yml`). Production tags `v1.x.x` are cut from `version/1.x`.

---

## QR Scanner WASM (`public/wasm/zxing_reader.wasm`)

The mobile-key QR scanner (`vue-qrcode-reader` → `barcode-detector` → `zxing-wasm`) fetches its decoder
from `fastly.jsdelivr.net` by default. Unacceptable for unlocking a door, so the file is checked into
`public/wasm/` and loaded from there via `setZXingModuleOverrides({ locateFile })`.

**The file is coupled to an exact package version.** The JS glue code is baked into `zxing-wasm` and only
works with the `.wasm` shipped alongside it. A mismatch breaks the decoder **at runtime**, not at build
time — nothing in CI catches it. That is why `vue-qrcode-reader` and `zxing-wasm` are pinned **without a
caret** in `package.json`. `npm overrides` does not help: it can force the version in the tree, but it
cannot swap this file.

Both steps belong together when bumping the version:

```bash
# 1. re-pin vue-qrcode-reader / zxing-wasm in package.json (still without a caret), then:
cp node_modules/zxing-wasm/dist/reader/zxing_reader.wasm public/wasm/

# 2. confirm the two are identical
shasum -a 256 public/wasm/zxing_reader.wasm node_modules/zxing-wasm/dist/reader/zxing_reader.wasm
```

Current state (`zxing-wasm@1.1.3`, pinned transitively by `barcode-detector@2.2.2`):
`e1ad175faf7f043076b5b1154efaf0004830a3466b4e7ac726833e2d4b55e34c`

Two related settings in `nuxt.config.js` are load-bearing for the scanner and documented at their
definition: `'wasm-unsafe-eval'` in `script-src`, and `permissionsPolicy.camera`.

## Server-Side Cache

`createConditionalCachedHandler` keeps the answer of a Nitro proxy route in an in-memory SWR cache — but only an answer that carries **no tenant or offer release**. With tenant supervision a tenant can be blocked and an offer's approval withdrawn at any time, and the next request has to show it. A handler marked `releaseSensitive: true` is therefore never cached, whatever `NUXT_CACHE_ENABLED` says.

```bash
NUXT_CACHE_ENABLED=true   # SWR cache for release-free answers enabled (default when not set)
NUXT_CACHE_ENABLED=false  # Disable it as well (recommended for local development)
```

| Route | Server cache | Notes |
| --- | --- | --- |
| `/api/catalog/bundle` | never | Release-sensitive |
| `/api/catalog/[t]/bundle` | never | Release-sensitive |
| `/api/catalog/mode` | 300s, swr | Portal mode, portal URL and branding only; key scoped `anon` / `auth` |

`NUXT_CACHE_ENABLED` now only switches the `/api/catalog/mode` cache and, set to `false`, forces the Theme Bundle revalidation interval to `0`. It no longer decides how fresh tenants and offers are.

Every proxy answer that carries a release — `/api/catalog/**` (except `mode`), `/api/tenants/**`, `/api/bookables/**` (availability, block periods, occupancy, prices), `/api/events/**` and `/api/checkout/**` — goes out with `Cache-Control: no-store` (`server/middleware/release-freshness.ts`), so no browser, CDN or reverse proxy stores it. Do not override that header at the reverse proxy.

The image proxy `/api/img` passes the backend's `Cache-Control`, `ETag` and `Last-Modified` of a media file through unchanged and adds no lifetime of its own: how long an offer image may be kept is the backend's decision. Versioned theme assets keep their long lifetime.

`/api/theme/bundle`, `/api/theme/css`, `/api/theme/[slug].css` and `/api/theme/favicon` are **not** in this cache. Their freshness is the Theme Bundle's own: the bundle is held per process and revalidated against the backend with a conditional GET (`NUXT_THEME_REVALIDATE_SECONDS`, `NUXT_THEME_REVALIDATE_TIMEOUT_MS`), and the rendered CSS and favicon bytes are memoised per etag. See [ADR 0001](docs/adr/0001-theme-bundle-revalidation-instead-of-purge.md).

---

## Documentation

| Topic | Description |
|-------|-------------|
| [Architecture](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/architecture.md) | System components, data flow, version lines |
| [Deployment](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/deployment.md) | Production setup, Docker, operations |
| [API Reference](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/api/README.md) | Endpoints, permissions, examples |
| [Authentication](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/api/authentication.md) | Auth routes and JWT configuration |
| [Web Integration](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/web-integration.md) | Embed bookables & events in existing websites (JS web interface) |
| [Changelog](https://github.com/ECCdigital/smart-city-booking-backend/blob/develop/docs/CHANGELOG.md) | Version history and breaking changes |

---

## License

GPL-3.0 — see [LICENSE.md](LICENSE.md)
