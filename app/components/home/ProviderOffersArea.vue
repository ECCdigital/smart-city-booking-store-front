<template>
  <section v-if="tiles.length > 0" style="padding: 50px 0">
    <h2 class="text-2xl font-bold mb-5">{{ $t("home.providers.title") }}</h2>

    <ul class="m-0 p-0 list-none grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="tile in tiles" :key="tile.id">
        <!-- The tenant's own home, not the current tenant's path: the area
             only shows on the instance home. -->
        <NuxtLink
          :to="`/t/${tile.id}`"
          class="flex flex-col h-full gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 transition duration-200 ease-out hover:shadow-lg hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
        >
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ tile.name }}
          </p>
          <!-- Plain text the tenant wrote: interpolated, never `v-html`. -->
          <p
            v-if="tile.description"
            class="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line"
          >
            {{ tile.description }}
          </p>
          <div class="flex-1" />
          <p
            class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400"
          >
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-door-open" aria-hidden="true" />
              {{ $t("home.providers.bookables", tile.bookableCount) }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar" aria-hidden="true" />
              {{ $t("home.providers.events", tile.eventCount) }}
            </span>
          </p>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { providerTiles } from "~/utils/providerOffers.js";

const props = defineProps({
  tenants: {
    type: Array,
    required: true,
  },
});

const tiles = computed(() => providerTiles(props.tenants));
</script>
