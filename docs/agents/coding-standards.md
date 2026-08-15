# Coding Standards

## Language

All project artifacts must be in **English**:

- Source code (identifiers, string literals meant for developers/logs)
- Comments and JSDoc
- Commit messages and PR titles/descriptions
- Changelog entries (`doc/CHANGELOG.md`)

User-facing copy goes through **i18n** — see [i18n.md](i18n.md). Do not hardcode German or English UI strings in components.

## DRY (Don't Repeat Yourself)

Avoid duplication, but don't over-abstract:

- **Reuse first** — check existing composables in `app/composables/`, stores in `stores/`, and server utils in `server/api/utils/` before writing new helpers
- **Extract on repetition** — when the same logic appears in 2+ places, move it to a composable or utility
- **Single source of truth** — constants, validation rules, and API call patterns should live in one place
- **Pragmatic abstractions** — don't create helpers for one-off logic; inline is fine there

```javascript
// ❌ BAD — duplicated tenant path logic in a component
const path = `/t/${route.params.tenantID}/catalog/${slug}`;

// ✅ GOOD — use the existing composable
const { tenantPath } = useTenantRoute();
const path = tenantPath(`/catalog/${slug}`);
```

## Module system

Mixed JavaScript and TypeScript — match the file you're editing:

- New composables and server utilities: prefer TypeScript (`.ts`)
- Existing `.js` files: keep as JavaScript unless refactoring the whole file
- Vue SFCs: `<script setup>` without `lang="ts"` unless the file already uses TypeScript

```typescript
// TypeScript composable
export function useApiClient() { /* … */ }

// JavaScript store (existing pattern)
export const useAuthStore = defineStore("auth", { /* … */ });
```

## Formatting

- ESLint via `@nuxt/eslint` (flat config in `eslint.config.mjs`)
- Run `npm run lint:check` before finishing
- Match surrounding code style (semicolons, quotes) in the file you're editing

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| Vue components | PascalCase files | `CheckoutContactStep.vue` |
| Composables | camelCase `use*` prefix | `useCatalogBundle.js` |
| Stores | camelCase file, kebab store id | `stores/auth.js` → `"auth"` |
| Server routes | REST-style filenames | `login.post.js`, `[bookableID].get.js` |
| Utils | camelCase | `checkoutQuery.ts`, `handleError.js` |
| Types | PascalCase interfaces | `CatalogParams` |

## API access

Client code must call the BFF, not the backend directly:

```javascript
// ❌ BAD — calling backend from client
const data = await $fetch(`${config.public.apiBaseUrl}/bookables`);

// ✅ GOOD — via BFF with credentials
const { data, error } = await useApiClient().get("/api/bookables");

// ✅ GOOD — direct $fetch to BFF (auth routes)
const response = await $fetch("/api/auth/login", { method: "POST", body });
```

Server routes use `serverFetch()` or direct `$fetch` to `apiBaseUrl`:

```typescript
const { data, error } = await serverFetch(event, "/bookables");
```

## Error handling

Client composables return `{ data, error }` result objects (via `useApiClient` / `serverFetch`).

Pages use `handleError()` from `app/utils/handleError.js` for user-facing error states:

```javascript
try {
  await loadBundle({ slug: catalogSlug.value });
} catch (err) {
  handleError({ statusCode: 404 }, t("errors.noCatalog"));
}
```

Server routes throw H3 errors:

```javascript
throw createError({
  statusCode: error.response?.status || 500,
  statusMessage: error.response?.data?.message || "Login failed",
});
```

## Logging

Server-side only — use Pino via `server/api/utils/logger.js`:

```javascript
import { logger } from "../utils/logger.js";
logger.info({ tenantId }, "Catalog bundle loaded");
```

Do not use `console.log` in server code. Client-side logging should be minimal.

## Vue conventions

- `<script setup>` with Composition API (no Options API for new code)
- Use `defineModel` for two-way binding where appropriate
- Props with `defineProps`, emits with `defineEmits`
- Auto-imports: Nuxt auto-imports composables, components, and Vue APIs — no manual imports needed for `ref`, `computed`, `useRoute`, etc.
- Component imports: use relative paths for co-located components, `~/` alias for cross-directory

## Auth & security

- Tokens in HTTP-only cookies — never store tokens in Pinia, localStorage, or client state
- `secure: true` on cookies in production (`NODE_ENV === "production"`)
- Auth-scoped server cache keys when responses differ by login state
- CSRF protection via `nuxt-csurf` where applicable

## What to avoid

- Calling the backend API directly from client code
- Exposing auth tokens to client-side JavaScript
- Hardcoded UI strings (use i18n)
- Large abstractions for one-off use
- Changing unrelated files in the same PR
- Hardcoded secrets or environment-specific URLs
- `console.log` in production server code
