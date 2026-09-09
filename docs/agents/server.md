# Server / BFF Layer

## Structure

```
server/
  api/
    auth/              # Authentication (login, signup, SSO, card, refresh)
    catalog/           # Catalog bundle, mode, slug lookup
    checkout/          # Checkout flow endpoints
    bookings/          # User bookings, invoices, receipts, mobile keys
    bookables/         # Bookable data, availability, pricing, occupancy
    events/            # Event listing, iCal export
    tenants/           # Tenant info, payment providers, user roles
    theme/             # Tenant theming (bundle, CSS, logo, favicon)
    instance/          # Global instance config
    memberships/       # User memberships
    user/              # User profile updates
    utils/             # serverFetch, logger, loadBundleData, themeBundle
  service/
    AuthService.js     # Token refresh, cookie management
  utils/
    conditionalCache.ts  # SWR cache wrapper with auth-scoped keys
  middleware/
    log.js             # Request logging
```

## Route pattern

Nitro file-based routing — filename determines method and path:

| File | Route | Method |
|------|-------|--------|
| `auth/login.post.js` | `/api/auth/login` | POST |
| `bookables/[tenantID].get.js` | `/api/bookables/:tenantID` | GET |
| `checkout/[bookableID]/validate.post.js` | `/api/checkout/:bookableID/validate` | POST |

## Handler pattern

```javascript
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

  try {
    const response = await $fetch(`${API_BASE_URL}/some/endpoint`, {
      method: "POST",
      body,
      headers: { Authorization: `Bearer ${getCookie(event, "access-token")}` },
    });
    return { success: true, data: response };
  } catch (error) {
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.data?.message || "Request failed",
    });
  }
});
```

Prefer `serverFetch()` for standard proxy calls — it handles auth headers and error wrapping:

```typescript
import { serverFetch } from "../utils/serverFetch";

export default defineEventHandler(async (event) => {
  const { data, error } = await serverFetch(event, "/bookables");
  if (error) throw createError({ statusCode: error.status, statusMessage: error.message });
  return data;
});
```

## Auth routes

Auth handlers manage HTTP-only cookies:

```javascript
setCookie(event, "access-token", accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
});
```

- Login/signup set both `access-token` and `refresh-token` cookies
- Logout clears cookies
- SSO routes handle Keycloak redirect/callback flow (`server/api/auth/sso/`)
- Token refresh in `AuthService.js` and `POST /api/auth/refresh`

## Caching

Use `createConditionalCachedHandler` for cacheable public/semi-public routes:

```typescript
import { createConditionalCachedHandler } from "../../utils/conditionalCache";

export default createConditionalCachedHandler(
  defineEventHandler(async (event) => { /* handler */ }),
  {
    maxAge: 300,
    swr: true,
    authScoped: true,  // separate cache for anon vs authenticated
    getKey: (event) => `custom-key-${event.context.params.slug}`,
  }
);
```

Cache is disabled when `NUXT_CACHE_ENABLED=false`. Always use `authScoped: true` when response content depends on login state.

Do not wrap the theme routes in it: they read the Theme Bundle from the store in
`server/utils/themeBundleStore.ts`, which owns their freshness (ADR 0001). A
cached handler would also overwrite the `Cache-Control` a versioned request has
earned.

## Adding a new BFF route

1. Create handler in `server/api/` following Nitro file naming conventions
2. Proxy to the corresponding backend endpoint at `apiBaseUrl`
3. Forward auth via cookie (`serverFetch` or manual `getCookie`)
4. Return a consistent shape: `{ success: true, data: … }` or throw `createError`
5. Add auth-scoped caching if the response varies by login state
6. Client composable in `app/composables/api/` if the endpoint is used from multiple places

## Runtime config

Server-side config from environment variables (see `.env.example`):

| Config key | Env var | Purpose |
|------------|---------|---------|
| `apiBaseUrl` | `NUXT_API_BASE_URL` | Backend API base URL |
| `userBaseUrl` | `NUXT_USER_BASE_URL` | Storefront public URL |
| `adminBaseUrl` | `NUXT_ADMIN_BASE_URL` | Admin portal URL |
| `public.adminBaseUrl` | `NUXT_PUBLIC_ADMIN_BASE_URL` | Admin portal link; its origin (`shared/utils/adminOrigin.ts`) is the only one allowed to frame the Hero's Live Preview (`/preview/hero`) — see `server/plugins/hero-preview-headers.ts` |
| `cacheEnabled` | `NUXT_CACHE_ENABLED` | Server-side SWR cache |

Access via `useRuntimeConfig()` in server handlers, `useRuntimeConfig().public` for client-safe values.
