# Smart City Booking Store Front

Customer-facing web interface for the **Smart City Booking** ecosystem. The application displays booking offers, provides checkout, and gives logged-in users an overview of their bookings.

All business data (offers, availability, bookings, payments, authentication) is provided by the backend:

**[smart-city-booking-backend](https://github.com/ECCdigital/smart-city-booking-backend/pkgs/container/smart-city-booking-backend)**

This repository contains only the store front (Nuxt 4 / Vue 3). Server routes under `/api/*` act as a BFF proxy to the backend and store tokens in HTTP-only cookies.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Production Build](#production-build)
- [Docker](#docker)
- [Operations](#operations)
- [Server-Side Cache](#server-side-cache)

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
Browser  →  Store Front (Nuxt SSR / Nitro)  →  smart-city-booking-backend
              /api/*  (BFF proxy)                REST API
```

- **Frontend**: Nuxt 4 with SSR, Pinia state, Nuxt UI
- **Server**: Nitro (`node-server` preset) – all sensitive API calls run server-side
- **Backend**: Separate container/service – must be reachable at `NUXT_API_BASE_URL`
- **Multi-tenant**: Routes under `/t/:tenantID/...` are automatically derived from the standard routes

---

## Prerequisites

| Component | Version |
| --- | --- |
| Node.js | 20.x (recommended; CI tests 18.x and 20.x) |
| npm | 9+ |
| Backend | [smart-city-booking-backend](https://github.com/ECCdigital/smart-city-booking-backend/pkgs/container/smart-city-booking-backend) running and reachable |

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/ECCdigital/smart-city-booking-store-front.git
cd smart-city-booking-store-front
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

At minimum, adjust the following values:

```bash
NUXT_API_BASE_URL=http://localhost:8080        # Backend URL
NUXT_USER_BASE_URL=http://localhost:3000        # URL of this store front
NUXT_PUBLIC_USER_BASE_URL=http://localhost:3000
NUXT_CACHE_ENABLED=false                        # Disable cache during development
```

> **Note:** Nuxt loads `.env` automatically (`dotenv/config` in `nuxt.config.js`). Runtime config values are applied at build time or on server start.

### 4. Start the backend

The backend must be running before the store front and reachable at the configured `NUXT_API_BASE_URL`. See the backend documentation in the linked repository.

### 5. Start the development server

```bash
npm run dev
```

The application is available at **http://localhost:3000**.

---

## Environment Variables

Nuxt automatically maps `runtimeConfig` fields to `NUXT_*` variables. Public values (exposed to the browser) require the `NUXT_PUBLIC_` prefix.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NUXT_API_BASE_URL` | **Yes** | `""` | Base URL of the backend (e.g. `https://api.booking.example.com`). Used server-side for all API calls. |
| `NUXT_PUBLIC_API_BASE_URL` | No | `""` | Public backend URL, if needed by the client. |
| `NUXT_USER_BASE_URL` | **Yes** | `""` | Public URL of the store front. Used server-side to build verify/reset links in auth emails. |
| `NUXT_PUBLIC_USER_BASE_URL` | **Yes** | `""` | Same URL, for client-side redirects (e.g. password reset). |
| `NUXT_ADMIN_BASE_URL` | No | `""` | Admin portal URL (server-side). |
| `NUXT_PUBLIC_ADMIN_BASE_URL` | No | `""` | Admin portal link in navigation (only for users with memberships). |
| `NUXT_PUBLIC_SILENT_SSO_ENABLED` | No | `false` | `true` enables automatic SSO check on page load (Keycloak silent check). |
| `NUXT_CACHE_ENABLED` | No | enabled | `false` disables the server-side SWR cache for catalog and theme routes. |
| `LOG_LEVEL` | No | `info` | Pino log level: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. |
| `PORT` | No | `3000` | HTTP port in Docker/production. |
| `NODE_ENV` | – | – | `development` or `production`. Controls e.g. the `secure` flag on cookies. |

A full template with comments is available in [`.env.example`](.env.example).

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

## Development

```bash
# Development server with hot reload
npm run dev

# ESLint
npm run lint:check
```

Other package managers work the same way:

```bash
pnpm install && pnpm dev
yarn install && yarn dev
bun install && bun run dev
```

---

## Production Build

```bash
# Create build
npm run build

# Start local production server (for testing)
npm run preview
```

The build produces a Nitro bundle under `.output/`, which can be started with `node .output/server/index.mjs`.

---

## Docker

### Build image

```bash
docker build -t smart-city-booking-store-front .
```

### Start container

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

### Typical deployment with backend

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

---

## Operations

### Health & availability

- The app listens on `PORT` (default `3000`).
- Ensure the backend is reachable at `NUXT_API_BASE_URL` – without the backend, catalog, checkout, and auth will not work.
- Set `NUXT_USER_BASE_URL` / `NUXT_PUBLIC_USER_BASE_URL` to the publicly reachable URL (including scheme, no trailing slash) so auth links in emails are correct.

### Logging

Server logs are written via **Pino**. Control the log level with `LOG_LEVEL`:

```bash
LOG_LEVEL=debug   # Development / troubleshooting
LOG_LEVEL=warn    # Production with less noise
```

### Cookies & HTTPS

In `NODE_ENV=production`, auth cookies are set with the `Secure` flag. The store front must therefore run behind HTTPS.

### SSO / Keycloak

- SSO endpoints: `/api/auth/sso/*`
- Silent SSO (`NUXT_PUBLIC_SILENT_SSO_ENABLED=true`) checks on the first page load whether a Keycloak session exists.
- Keycloak configuration is done in the backend/instance setup, not in the store front.

### Scaling

- Stateless Nitro server – horizontally scalable behind a load balancer.
- The server-side SWR cache (`NUXT_CACHE_ENABLED`) is local per instance (LRU). With multiple replicas, cache state may briefly differ – generally acceptable for catalog data.

### Release versioning

```bash
npm run release:patch    # Patch release
npm run release:minor    # Minor release
npm run release:major    # Major release
npm run release:rc       # Release candidate
```

Published GitHub releases trigger the Docker build workflow (`.github/workflows/docker-publish.yml`).

---

## Server-Side Cache

The Nitro server proxy routes (`/api/catalog/...`, `/api/theme/...`) use
`createConditionalCachedHandler` to optionally keep responses in an SWR cache.
Behavior is controlled by the environment variable:

```bash
NUXT_CACHE_ENABLED=true   # SWR cache enabled (default when not set)
NUXT_CACHE_ENABLED=false  # Disable cache (recommended for local development)
```

> The cache is **enabled by default** unless `NUXT_CACHE_ENABLED` is explicitly set to `false`.

### Recommended `maxAge` values

| Route | maxAge | swr | Notes |
| --- | --- | --- | --- |
| `/api/catalog/bundle` | 300s | yes | Auth-scoped key (anon vs. auth cookie) |
| `/api/catalog/[t]/bundle` | 300s | yes | Includes tenantID + slug in cache key |
| `/api/catalog/mode` | 300s | yes | Public |
| `/api/theme/css` | 300s | n/a | Public, anon-scoped |
| `/api/theme/[slug].css` | 300s | n/a | Includes slug in key |
| `/api/theme/hero` | 300s | n/a | Reuses `themeBundle` per request |
| `/api/theme/logo` | 300s | n/a | Reuses `themeBundle` per request |

The bundle endpoints split the cache key into `auth` vs. `anon` based on the `access-token` cookie.
Anonymous requests share a cached response; authenticated requests fall into the
`auth` scope (further keyed by slug / tenant / bookable / event / include).

---

## License

This project is licensed under the
[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html). See the
[LICENSE.md](LICENSE.md) file for details.
