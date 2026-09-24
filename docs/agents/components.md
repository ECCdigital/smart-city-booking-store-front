# Vue Components & Pages

## Structure

```
app/
  pages/                 # File-based routing
    index.vue            # Home / catalog redirect
    catalog/             # Catalog browsing & search
    bookables/           # Bookable detail pages
    events/              # Event detail pages
    checkout/            # Multi-step checkout flow
    account/               # User account (bookings, invoices, keys, settings)
    login.vue            # Auth pages
    register/
    password/
    sso/
    card-login/
  components/            # Grouped by feature domain
    search/              # Catalog search, filters, results, map, details
    checkout/            # Checkout steps, time selection, price summary
    auth/                # Login, register, SSO, card auth, email verification
    bookables/           # Bookable display components
    events/              # Event display components
    user/                # Account area (bookings, settings)
    mobileKey/           # Mobile key access
    navigation/          # Nav bar, side nav, auth actions
    inputs/              # Reusable form inputs (date, time, text, address)
  layouts/
    default.vue          # Standard page layout
    catalog.vue          # Catalog with search/filter sidebar
    checkout.vue         # Checkout flow layout
    panel.vue            # Account panel layout
```

## Page pattern

Pages use `<script setup>`, composables for data loading, and `definePageMeta` for layout/middleware:

```vue
<script setup>
definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
});

const route = useRoute();
const { loadBundle } = useCatalogBundle();

await loadBundle({ slug: route.params.catalogSlug });
usePageTitle();
</script>

<template>
  <NavigationBar />
  <!-- page content -->
</template>
```

## Component pattern

Feature components use `<script setup>` with props, models, and composables:

```vue
<script setup>
const props = defineProps({
  requiredFieldKeys: { type: Array, default: () => [] },
});

const contact = defineModel("contact", { type: Object, required: true });

const { t } = useI18n();
</script>

<template>
  <div>{{ t("checkout.contact.title") }}</div>
</template>
```

## Conventions

- **Auto-imports:** Nuxt auto-imports Vue APIs, composables, and components — don't manually import `ref`, `computed`, `useRoute`, etc.
- **UI library:** Use Nuxt UI components (`UButton`, `UCard`, `UInput`, …) — check existing usage before adding custom HTML
- **Styling:** Tailwind CSS utility classes — match existing patterns in the component's feature area
- **Icons:** `@nuxt/icon` — use `<Icon name="…" />` (Heroicons by default)
- **Images:** `useMediaImage()` — `v-bind` its `imageSource(reference, context)` onto a plain `<img>`. It builds `src`/`srcset`/`sizes` from the backend's media presets and routes every image through the `/api/img` proxy, so pages stay same-origin. Never assemble a proxy URL by hand
- **Navigation:** Use `useTenantRoute().tenantTo()` for links in tenant context, `<NuxtLink>` otherwise

## Data loading

| Pattern | When | Example |
|---------|------|---------|
| `await` in `<script setup>` | SSR-friendly initial load | `await loadBundle({ slug })` |
| `onMounted` + composable | Client-only data | Search results after filter change |
| Pinia store | Shared state across components | `useAuthStore()`, `useCatalogStore()` |
| `useFetch` / `useAsyncData` | Direct API fetch with SSR | Less common — prefer composables |

## Middleware

| Middleware | Purpose |
|------------|---------|
| `auth.global.js` | Validates auth on every route, hydrates auth store |
| `catalog-auth.js` | Ensures catalog pages handle auth state for bundle loading |
| `catalog-guard.js` | Redirects if catalog mode/slug is invalid |

## Adding a new page

1. Create `.vue` file in `app/pages/` following Nuxt file-based routing
2. Set `definePageMeta` with appropriate layout and middleware
3. Load data via existing composables or create a new one in `app/composables/`
4. Add i18n keys for all user-facing strings
5. If tenant-scoped, the `tenant-routes` module auto-generates `/t/:tenantID/…` variant
6. Use `usePageTitle()` for dynamic page titles

## Adding a new component

1. Place in the appropriate feature folder under `app/components/`
2. Use PascalCase filename matching the component name
3. Keep components focused — extract sub-components when a file exceeds ~300 lines
4. All user-facing text via `t("key")` from `useI18n()`
5. Props for input, emits/models for output — avoid prop drilling beyond 2 levels (use composables or stores instead)

## Checkout flow

Multi-step checkout in `app/pages/checkout/[bookableID].vue`:

1. Time/period selection
2. Contact details & custom fields
3. Payment
4. Review & confirmation

Each step is a component in `app/components/checkout/`. State managed via composables (`useCheckout`) and URL query params (`checkoutQuery.ts`).

## Search & catalog

Catalog browsing uses composables in `app/composables/search/`:

- `useBookableSearch.ts` — search, filter, sort logic
- `useCatalogQueryState.ts` — URL query param sync for filters
- `useCustomFieldFilters.js` — dynamic custom field filtering

Results rendered via components in `app/components/search/` (grid, list, map views).
