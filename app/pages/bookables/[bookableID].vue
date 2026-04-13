<script setup>
import { useBookableStore } from "~~/stores/bookable.js";
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

const catalogSlug = computed(() => route.params.catalogSlug);
const bookableID = computed(() => route.params.bookableID);

const { loadBundle } = useCatalogBundle();

const bookable = computed(() => {
  return bookableStore.getBookableById(bookableID.value);
});

if (!bookable.value) {
  await loadBundle({ slug: catalogSlug.value, bookableID: bookableID.value });
}
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
