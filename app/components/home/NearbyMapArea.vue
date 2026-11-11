<template>
  <section v-if="placed.length > 0" style="padding: 50px 0">
    <div class="md:flex items-end justify-between mb-5 gap-4">
      <div class="space-y-1.5">
        <h2 class="text-2xl font-bold">{{ $t("home.nearby.title") }}</h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t("home.nearby.count", placed.length) }}
        </p>
      </div>
      <UButton
        variant="ghost"
        :label="$t('home.nearby.openSearch')"
        trailing-icon="i-lucide-chevron-right"
        :to="tenantTo({ path: '/search', query: { view: 'map' } })"
        class="my-2 md:my-0"
      />
    </div>

    <!-- The search page's map without its list, filter and full screen. -->
    <ResultsMap :bookables="offers" compact />

    <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
      {{ $t("home.nearby.hint") }}
    </p>
  </section>
</template>

<script setup>
import ResultsMap from "~/components/search/ResultsMap.vue";
import { isBookableOffer, mergeOffers } from "~/composables/search/offer";
import { MatchStatus } from "~/composables/search/catalogFilters";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
  events: {
    type: Array,
    default: () => [],
  },
});

const { tenantTo } = useTenantRoute();

// The same Offers the search page puts on its map, all of them matching.
const offers = computed(() =>
  mergeOffers(props.bookables, props.events).map((item) => ({
    item,
    isBookable: isBookableOffer(item),
    matchStatus: MatchStatus.MATCH,
  })),
);

const placed = computed(() =>
  offers.value.filter(
    ({ item }) =>
      item.location?.coordinates?.points?.[0] &&
      item.location?.coordinates?.points?.[1],
  ),
);
</script>
