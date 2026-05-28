# Biletado

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## Server-Side Cache

The Nitro server proxy routes (`/api/catalog/...`, `/api/theme/...`) use
`createConditionalCachedHandler` to optionally wrap responses in
`cachedEventHandler`. Behaviour is controlled by the env flag:

```bash
NUXT_CACHE_ENABLED=true  # enable SWR cache in production
NUXT_CACHE_ENABLED=false # disable (default for local dev)
```

### Recommended `maxAge`

| Route                      | maxAge | swr  | Notes                                   |
| -------------------------- | ------ | ---- | --------------------------------------- |
| `/api/catalog/bundle`      | 300s   | yes  | Auth-scoped key (anon vs auth cookie)   |
| `/api/catalog/[t]/bundle`  | 300s   | yes  | Includes tenantID + slug in cache key   |
| `/api/catalog/mode`        | 300s   | yes  | Public                                  |
| `/api/theme/css`           | 300s   | n/a  | Public, anon-scoped                     |
| `/api/theme/[slug].css`    | 300s   | n/a  | Includes slug in key                    |
| `/api/theme/hero`          | 300s   | n/a  | Re-uses `themeBundle` per request       |
| `/api/theme/logo`          | 300s   | n/a  | Re-uses `themeBundle` per request       |

The bundle endpoints split the cache key into `auth` vs `anon` scopes based
on the `access-token` cookie. Anonymous requests share a cached response
while authenticated requests fall into the `auth` scope (further keyed by
slug / tenant / bookable / event / include).
