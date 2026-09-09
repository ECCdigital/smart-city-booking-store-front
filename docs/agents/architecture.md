# Architecture

## Ecosystem

This repository is the public storefront. Related repositories:

| Component | Repository |
|-----------|------------|
| Backend API | https://github.com/ECCdigital/smart-city-booking-backend |
| Admin UI | https://github.com/ECCdigital/smart-city-booking-vue-app |
| Storefront | https://github.com/ECCdigital/smart-city-booking-store-front (this repo) |

The storefront requires the **v4.x backend API**. It does not support v3.x.

## Stack

- **Framework:** Nuxt 4 (SSR enabled, Nitro `node-server` preset)
- **UI:** Vue 3, Nuxt UI, Tailwind CSS
- **State:** Pinia with persisted state plugin
- **i18n:** `@nuxtjs/i18n` — German (default) and English
- **Maps:** Leaflet via `@nuxtjs/leaflet`
- **Auth:** JWT in HTTP-only cookies, SSO via Keycloak, card login
- **Logging:** Pino (`LOG_LEVEL` env var)

## Data flow

```
Browser  →  Storefront (Nuxt SSR / Nitro)  →  Backend API (v4.x)
              /api/*  (BFF proxy)                REST API
```

- Client code calls `/api/*` routes (same origin)
- Nitro handlers proxy to `NUXT_API_BASE_URL`, attaching the `access-token` cookie as `Authorization: Bearer`
- Auth tokens never reach client-side JavaScript

## Directory layout

```
app/
  pages/                 # File-based routes (catalog, checkout, account, auth)
  components/            # Vue SFCs grouped by feature (search/, checkout/, auth/, …)
  composables/           # Reusable logic (api/, auth/, search/, utils/)
  layouts/               # default, catalog, checkout, panel
  middleware/            # auth.global, catalog-auth, catalog-guard
  plugins/               # Client/server plugins (SSO, Pinia persistence)
  utils/                 # Pure helpers (checkoutQuery, bookingStatus, …)
  assets/                # Static images, CSS
  types/                 # App-local TypeScript types
server/
  api/                   # Nitro BFF routes mirroring backend endpoints
    auth/                # Login, signup, SSO, card auth, token refresh
    catalog/             # Catalog bundle, mode, slug lookup
    checkout/            # Checkout flow, validation, completion
    bookings/            # User bookings, invoices, mobile keys
    theme/               # Tenant CSS, logo, hero, favicon
    utils/               # serverFetch, logger, loadBundleData, themeBundle
  service/               # AuthService (token refresh, cookie management)
  utils/                 # conditionalCache (SWR cache wrapper)
  middleware/            # Request logging
stores/                  # Pinia stores (auth, catalog, bookings, portal, instance)
modules/                 # Nuxt modules (tenant-routes)
shared/types/            # Shared TypeScript types (api.ts)
i18n/locales/            # de.json, en.json
```

## Multi-tenancy

The `tenant-routes` module duplicates all pages under `/t/:tenantID/...`:

```
/catalog/my-catalog          →  /t/:tenantID/catalog/my-catalog
/bookables/:bookableID       →  /t/:tenantID/bookables/:bookableID
```

- Use `useTenant()` to read the current tenant ID from route params
- Use `useTenantRoute()` for tenant-aware paths and navigation (`tenantPath`, `tenantTo`)
- Auth, login, register, and password routes are excluded from tenant duplication

## Key patterns

| Layer | Pattern | Example |
|-------|---------|---------|
| Page | `<script setup>` + composables | `app/pages/catalog/[catalogSlug].vue` |
| Composable | `use*` function returning reactive state + actions | `app/composables/useCatalogBundle.js` |
| API composable | Wraps `useApiClient()` for a resource | `app/composables/api/useCheckout.js` |
| Store | Pinia `defineStore` for shared state | `stores/auth.js` |
| BFF route | `defineEventHandler` proxying backend | `server/api/auth/login.post.js` |
| Server fetch | `serverFetch()` with cookie auth | `server/api/utils/serverFetch.ts` |

## Auth flow

1. User submits credentials → `POST /api/auth/login`
2. Nitro handler calls backend `/auth/signin`, sets `access-token` and `refresh-token` cookies (HTTP-only)
3. Client calls `GET /api/auth/me` to hydrate user state (via `useAuthStore().validateAuth()`)
4. Token refresh handled server-side in `AuthService` and `POST /api/auth/refresh`
5. SSO: `/api/auth/sso/*` routes handle Keycloak redirect flow

## Caching

Server-side SWR cache on the catalog routes via `createConditionalCachedHandler`:

- Controlled by `NUXT_CACHE_ENABLED` (default enabled, set `false` for local dev)
- Auth-scoped cache keys (`anon` vs `auth`) prevent leaking private responses
- See README.md "Server-Side Cache" section for route-specific TTLs

The theme routes are the exception: they read the Theme Bundle from a
process-wide store that revalidates against the backend with a conditional GET
(`NUXT_THEME_REVALIDATE_SECONDS`), so an admin save reaches the public site
without a purge. See [ADR 0001](../adr/0001-theme-bundle-revalidation-instead-of-purge.md).

## Version lines

| Branch | Version | Notes |
|--------|---------|-------|
| `develop` | v1.x dev | Active development |
| `version/1.x` | v1.x stable | Production releases |

Work on `develop` unless told otherwise. Storefront v1.x requires backend v4.x.
