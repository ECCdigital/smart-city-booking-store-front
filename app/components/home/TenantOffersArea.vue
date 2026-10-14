<template>
  <section v-if="tiles.length > 0" style="padding: 50px 0">
    <div class="flex items-center mb-5">
      <h2 class="text-2xl font-bold">{{ $t("home.providers.title") }}</h2>
      <div class="flex-1" />
      <UButton
        variant="ghost"
        :label="$t('home.providers.all')"
        trailing-icon="i-lucide-chevron-right"
        to="/search"
      />
    </div>

    <ul class="m-0 p-0 list-none grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="tile in tiles" :key="tile.id">
        <!-- The tenant's own home, not the current tenant's path: the area
             only shows on the instance home. -->
        <NuxtLink
          :to="`/t/${tile.id}/search`"
          class="group flex flex-col justify-between h-full gap-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition duration-200 ease-out hover:shadow-lg hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
        >
          <div>
            <div class="flex items-center gap-4">
              <span
                :class="ACCENTS[tenantAccent(tile.id, ACCENTS.length)]"
                class="shrink-0 w-14 h-14 rounded-xl text-white text-lg font-bold flex items-center justify-center"
                aria-hidden="true"
              >
                {{ tile.initials }}
              </span>
              <div class="min-w-0">
                <p
                  class="text-xl font-bold text-gray-900 dark:text-white break-words"
                >
                  {{ tile.name }}
                </p>
                <!-- A count breaks as a whole, never between number and word. -->
                <p class="text-gray-600 dark:text-gray-400">
                  <span
                    v-if="tile.bookableCount > 0"
                    class="whitespace-nowrap"
                    >{{
                      $t("home.providers.bookables", tile.bookableCount)
                    }}</span
                  >
                  <span v-if="tile.bookableCount > 0 && tile.eventCount > 0">
                    ·
                  </span>
                  <span v-if="tile.eventCount > 0" class="whitespace-nowrap">{{
                    $t("home.providers.events", tile.eventCount)
                  }}</span>
                </p>
              </div>
            </div>

            <!-- Plain text the tenant wrote: interpolated, never `v-html`. -->
            <p
              v-if="tile.description"
              class="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line mt-2 text-sm"
            >
              {{ tile.description }}
            </p>
          </div>

          <div
            class="self-end inline-flex items-center gap-1 font-semibold text-primary"
          >
            {{ $t("home.providers.showOffers") }}
            <UIcon
              name="i-lucide-chevron-right"
              class="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { tenantAccent, tenantTiles } from "~/utils/tenantOffers.js";

// Written out whole so Tailwind finds the classes.
const ACCENTS = [
  "bg-sky-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-pink-600",
  "bg-orange-600",
  "bg-teal-700",
];

const props = defineProps({
  tenants: {
    type: Array,
    required: true,
  },
});

const tiles = computed(() => tenantTiles(props.tenants));
</script>
