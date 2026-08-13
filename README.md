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
