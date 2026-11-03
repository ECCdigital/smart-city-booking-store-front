<template>
  <div style="padding: 50px 0">
    <div class="md:flex items-center justify-between md:mb-5">
      <h2 class="text-2xl font-bold">{{ $t("catalog.type") }}</h2>
      <UButton
        variant="ghost"
        :label="$t('catalog.showAllOffers')"
        trailing-icon="i-lucide-chevron-right"
        :to="tenantTo('/search')"
        class="my-2 md:my-0"
      />
    </div>
    <div class="grid sm:grid-cols-2 lg:flex gap-5">
      <div
        v-for="(category, i) in tempCategories"
        :key="i"
        class="rounded-b-xl w-full lg:flex-1"
      >
        <MainCategoryCard :category="category" />
      </div>
    </div>
  </div>
</template>
<script setup>
import MainCategoryCard from "~/components/MainCategoryCard.vue";

const { t } = useI18n();
const { tenantTo } = useTenantRoute();

// Each card opens the Result Page with its Kinds preset in the `cat` facet.
//toDo - read categories from instance settings
const tempCategories = computed(() => [
  {
    cat: "event-location",
    title: t("catalog.categories.eventLocationTitle"),
    description: t("catalog.categories.eventLocationDescription"),
    icon: "i-lucide-building-2",
  },
  {
    cat: "room",
    title: t("catalog.categories.roomTitle"),
    description: t("catalog.categories.roomDescription"),
    icon: "i-lucide-door-open",
  },
  {
    cat: "resource",
    title: t("catalog.categories.resourceTitle"),
    description: t("catalog.categories.resourceDescription"),
    icon: "i-lucide-wrench",
  },
  {
    cat: "event,ticket",
    title: t("catalog.categories.eventTitle"),
    description: t("catalog.categories.eventDescription"),
    icon: "i-lucide-calendar-check-2",
  },
]);
</script>

<style scoped></style>
