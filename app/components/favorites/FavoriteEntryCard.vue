<template>
  <div class="relative h-full">
    <!--
      One entry of the favorites list. An available Offer is drawn like a
      result card — picture, Kind, title, provider — and leads to its detail
      view, with the heart to remove the mark. An Offer the user does not
      reach any more, or one that is gone, keeps the title and the provider
      the snapshot holds, says so, and can only be removed.

      A removed entry does not go at once: the card greys out to enable undoing
      and a bar that runs down the undo window, so a slip of
      the hand is taken back on the spot. Only when the bar is out does the
      card leave and the rest close up.
    -->
    <NuxtLink
      v-if="available"
      :to="target"
      class="flex flex-col h-full shadow-lg bg-white dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
      :class="removing ? dimmed : ''"
      :tabindex="removing ? -1 : undefined"
      :aria-hidden="removing ? 'true' : undefined"
    >
      <div class="relative h-44 shrink-0">
        <BookableTypeBadge
          :type="offer.type"
          :is-event="isEvent"
          class="absolute top-2 left-2 z-10"
        />
        <FavoriteButton
          :item="offer"
          :is-event="isEvent"
          overlay
          :remove-with="() => emit('remove', entry)"
          class="absolute top-2 right-2 z-10"
        />
        <img
          v-if="image && !imageFailed"
          v-bind="image"
          :alt="title"
          loading="lazy"
          class="w-full h-full object-cover"
          @error="imageFailed = true"
        />
        <ClientOnly v-else>
          <ImagePlaceholder :theme="theme" class="w-full h-full" />
        </ClientOnly>
      </div>
      <USeparator color="primary" type="solid" size="xl" class="w-full" />
      <div class="p-3 text-gray-800 dark:text-gray-100">
        <p class="font-bold text-lg line-clamp-2 break-words">{{ title }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ tenantName }}</p>
      </div>
    </NuxtLink>

    <div
      v-else
      class="flex flex-col h-full justify-between border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-gray-800 dark:text-gray-100"
      :class="removing ? dimmed : ''"
      :aria-hidden="removing ? 'true' : undefined"
    >
      <div>
        <UBadge
          :label="stateLabel"
          :icon="deleted ? 'i-lucide-trash-2' : 'i-lucide-eye-off'"
          color="error"
          variant="subtle"
          class="mb-3"
        />
        <p class="font-bold text-lg line-clamp-2 break-words">{{ title }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ tenantName }}</p>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {{ stateHint }}
        </p>
      </div>
      <div class="flex justify-end mt-4">
        <UButton
          :label="$t('favorites.page.removeEntry')"
          icon="i-lucide-x"
          color="neutral"
          variant="outline"
          :loading="pending"
          class="cursor-pointer"
          @click="emit('remove', entry)"
        />
      </div>
    </div>

    <div
      v-if="removing"
      role="status"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/85 dark:bg-gray-900/85 text-gray-800 dark:text-gray-100 overflow-hidden"
    >
      <UIcon name="i-lucide-heart-off" class="text-3xl text-gray-500" />
      <p class="font-semibold">{{ $t("favorites.removeTitle") }}</p>
      <UButton
        :label="$t('favorites.page.undo')"
        icon="i-lucide-undo-2"
        color="neutral"
        variant="solid"
        class="cursor-pointer"
        @click="emit('undo', entry)"
      />
      <!-- The bar runs down the undo window; the card goes when it is out. -->
      <div
        class="absolute bottom-0 left-0 h-1 bg-primary countdown"
        :style="{ animationDuration: `${undoWindowMs}ms` }"
      />
    </div>
  </div>
</template>
<script setup>
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";
import FavoriteButton from "~/components/favorites/FavoriteButton.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";
import { useMediaImage } from "~/composables/utils/useMediaImage";
import {
  FAVORITE_STATUS,
  detailPathOf,
  isAvailable,
  offerOf,
  titleOf,
} from "~/composables/favorites/favoriteEntry.js";
import { useFavoritesStore } from "~~/stores/favorites.js";

const props = defineProps({
  entry: {
    type: Object,
    required: true,
  },
  // The entry is on its way out: the card greys out and offers to undo.
  removing: {
    type: Boolean,
    default: false,
  },
  undoWindowMs: {
    type: Number,
    default: 6000,
  },
});
const emit = defineEmits(["remove", "undo"]);

const dimmed = "grayscale opacity-50 pointer-events-none select-none";

const { t } = useI18n();
const colorMode = useColorMode();
const { coverImageOf, imageSource } = useMediaImage();
const { tenantID, tenantTo } = useTenantRoute();
const favoritesStore = useFavoritesStore();

const available = computed(() => isAvailable(props.entry));
const deleted = computed(() => props.entry.status === FAVORITE_STATUS.DELETED);
const offer = computed(() => offerOf(props.entry));
const isEvent = computed(() => props.entry.targetType === "event");
const title = computed(() => titleOf(props.entry));
const tenantName = computed(
  () => props.entry.tenantName || props.entry.tenantId,
);
const pending = computed(() => favoritesStore.isPending(props.entry));

// The detail view lives in the Offer's tenant. Inside another tenant's
// storefront the link crosses over to it; everywhere else it stays in the
// current context, where the catalog resolves the Offer across tenants.
const target = computed(() => {
  const path = detailPathOf(props.entry);
  if (tenantID.value && tenantID.value !== props.entry.tenantId) {
    return `/t/${encodeURIComponent(props.entry.tenantId)}${path}`;
  }
  return tenantTo(path);
});

const theme = computed(() => (colorMode.value === "dark" ? "dark" : "light"));
const image = computed(() =>
  offer.value
    ? imageSource(coverImageOf(offer.value, isEvent.value), "card")
    : null,
);
const imageFailed = ref(false);
watch(
  () => props.entry.targetId,
  () => {
    imageFailed.value = false;
  },
);

const stateLabel = computed(() =>
  deleted.value ? t("favorites.page.deleted") : t("favorites.page.unavailable"),
);
const stateHint = computed(() =>
  deleted.value
    ? t("favorites.page.deletedHint")
    : t("favorites.page.unavailableHint"),
);
</script>

<style scoped>
.countdown {
  width: 100%;
  animation-name: countdown;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes countdown {
  from {
    width: 100%;
  }
  to {
    width: 0;
  }
}
</style>
