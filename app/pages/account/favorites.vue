<template>
  <div class="w-full">
    <PageHeader
      :title="$t('account.favoritesTitle')"
      :description="$t('favorites.page.description')"
    />

    <div
      v-if="entries.length"
      class="md:flex justify-between items-center w-full mb-4 gap-4"
    >
      <p class="text-gray-600 dark:text-gray-300">
        {{ $t("favorites.page.count", shown.length, { count: shown.length }) }}
      </p>
      <USelect
        v-model="tenantFilter"
        :items="tenantItems"
        :aria-label="$t('favorites.page.filterByTenant')"
        icon="i-lucide-building-2"
        class="w-full md:w-64 mt-2 md:mt-0"
      />
    </div>

    <div
      v-if="loading"
      class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <USkeleton v-for="i in 6" :key="i" class="h-64 w-full rounded-xl" />
    </div>

    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <UIcon name="i-lucide-cloud-off" class="text-6xl text-gray-400 mb-4" />
      <p class="text-gray-500 mb-6">{{ $t("favorites.page.loadFailed") }}</p>
      <UButton :label="$t('common.retry')" @click="refresh()" />
    </div>

    <div
      v-else-if="shown.length"
      class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10"
    >
      <FavoriteEntryCard
        v-for="entry in shown"
        :key="favoriteKey(entry)"
        :entry="entry"
        @remove="remove"
      />
    </div>

    <div
      v-else-if="entries.length"
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <UIcon name="i-lucide-filter-x" class="text-6xl text-gray-400 mb-4" />
      <p class="text-gray-500">{{ $t("favorites.page.emptyForTenant") }}</p>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-16 text-center"
    >
      <UIcon name="i-lucide-heart" class="text-6xl text-gray-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {{ $t("favorites.page.emptyTitle") }}
      </h2>
      <p class="text-gray-500 max-w-md mb-6">
        {{ $t("favorites.page.emptyDescription") }}
      </p>
      <UButton
        :label="$t('favorites.page.browseOffers')"
        icon="i-lucide-search"
        :to="tenantTo('/search')"
      />
    </div>
  </div>
</template>
<script setup>
import FavoriteEntryCard from "~/components/favorites/FavoriteEntryCard.vue";
import { useFavorites } from "~/composables/api/useFavorites.js";
import {
  ALL_TENANTS,
  filterByTenant,
  stillMarked,
  tenantsOf,
} from "~/composables/favorites/favoriteEntry.js";
import { favoriteKey } from "~/composables/favorites/favoriteReference.js";
import { useFavoritesStore } from "~~/stores/favorites.js";

/**
 * The favorites page: every favorite of the signed-in user across all
 * tenants, each in its state, narrowed to one tenant on request. The
 * hydrated list is loaded for this visit; whether an entry is still marked
 * is the store's word, so a removal — from the heart of an available Offer
 * or the button of an unavailable or deleted one — takes the entry out at
 * once and a refused removal brings it back. Nothing leaves the list by
 * itself: an Offer the user no longer reaches or that is gone stays, named
 * from the snapshot, until the user removes it.
 */
definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountFavorites"));

const { tenantTo } = useTenantRoute();
const favoritesStore = useFavoritesStore();
const { fetchFavoriteOffers } = useFavorites();
const notification = useNotification();

const {
  data: loaded,
  status,
  error,
  refresh,
} = useAsyncData(
  "favorite-offers",
  async () => {
    const [, entries] = await Promise.all([
      favoritesStore.fetchFavorites({ force: true }),
      fetchFavoriteOffers(),
    ]);
    return entries;
  },
  { server: false, default: () => [] },
);

const loading = computed(
  () => status.value === "idle" || status.value === "pending",
);

const entries = computed(() =>
  stillMarked(loaded.value, favoritesStore.keys, favoritesStore.initialized),
);

const tenantFilter = ref(ALL_TENANTS);
const tenantItems = computed(() => [
  { label: t("favorites.page.allTenants"), value: ALL_TENANTS },
  ...tenantsOf(entries.value).map(({ id, name }) => ({
    label: name,
    value: id,
  })),
]);

watch(tenantItems, (items) => {
  if (!items.some((item) => item.value === tenantFilter.value)) {
    tenantFilter.value = ALL_TENANTS;
  }
});

const shown = computed(() => filterByTenant(entries.value, tenantFilter.value));

async function remove(entry) {
  try {
    await favoritesStore.unmark(entry);
  } catch (err) {
    // A dead session is handled by the API client itself.
    if (err?.statusCode === 401) return;
    notification.error(t("favorites.removeFailed"));
  }
}
</script>

<style scoped></style>
