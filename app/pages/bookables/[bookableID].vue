<script setup>
import { useBookableStore } from "~~/stores/bookable.js";
import { useAuthStore } from "~~/stores/auth.js";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import DetailsArea from "~/components/search/DetailsArea.vue";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
  hero: {
    height: "sm",
    showOnMobile: true,
  },
});

const route = useRoute();
const bookableStore = useBookableStore();
const authStore = useAuthStore();

const catalogSlug = computed(() => route.params.catalogSlug);
const bookableID = computed(() => route.params.bookableID);

const { loadDetail, isDetailLoadedForCurrentAuth } = useCatalogBundle();

const bookable = computed(() =>
  bookableStore.getBookableById(bookableID.value),
);

async function refreshBookableDetail({ force = false } = {}) {
  if (import.meta.client) {
    await authStore.validateAuth(true);
  }

  await loadDetail({
    slug: catalogSlug.value || null,
    bookableID: bookableID.value,
    force,
  });
}

await refreshBookableDetail();

onMounted(async () => {
  if (
    !isDetailLoadedForCurrentAuth({
      slug: catalogSlug.value || null,
      bookableID: bookableID.value,
    })
  ) {
    await refreshBookableDetail({ force: true });
  }
});

watch(
  () => authStore.isLoggedIn,
  (loggedIn, wasLoggedIn) => {
    if (wasLoggedIn === undefined || loggedIn === wasLoggedIn) return;
    void refreshBookableDetail({ force: true });
  },
);

const { t } = useI18n();
usePageTitle(() =>
  bookable.value?.title
    ? t("meta.pages.bookableDetail", { title: bookable.value.title })
    : t("meta.pages.bookables"),
);
</script>

<template>
  <div class="container">
    <div v-if="bookable">
      <DetailsArea :item="bookable" />
    </div>
    <div v-else class="text-center mt-10">
      <UIcon size="48" name="i-lucide-monitor-off" class="text-gray-400 mb-4" />
      <p class="text-gray-500">{{ $t("resources.noResource") }}</p>
      <UButton :label="$t('common.back')" to="/bookables" class="mt-4" />
    </div>
  </div>
</template>

<style scoped></style>
