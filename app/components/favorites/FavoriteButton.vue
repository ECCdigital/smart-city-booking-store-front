<template>
  <!-- A wrapper takes the parent's placement classes: the tooltip renders
       its trigger as the button itself and has no root of its own. -->
  <div v-if="hasTarget" class="inline-flex">
    <UTooltip :text="label" :delay-duration="400">
      <UButton
        :icon="active ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
        :aria-label="label"
        :aria-pressed="active ? 'true' : 'false'"
        :loading="pending"
        color="neutral"
        :variant="overlay ? 'ghost' : 'outline'"
        :size="overlay ? 'lg' : 'xl'"
        :class="[
          overlay
            ? 'rounded-full bg-white/85 dark:bg-gray-800/85 shadow hover:bg-white dark:hover:bg-gray-800'
            : 'justify-center px-3',
          active
            ? 'text-red-500 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-300',
          'cursor-pointer',
        ]"
        @click.stop.prevent="toggle"
      />
    </UTooltip>
  </div>
</template>
<script setup>
import { useAuthStore } from "~~/stores/auth.js";
import { useFavoritesStore } from "~~/stores/favorites.js";
import {
  FAVORITE_LIMIT_REACHED,
  favoriteErrorCodeOf,
  favoriteErrorParamsOf,
  referenceOf,
} from "~/composables/favorites/favoriteReference.js";

/**
 * The heart on an Offer: filled when the Offer is in the user's favorites
 * list, a click marks or removes it. Anonymous visitors see it empty and a
 * click takes them to the sign-in page, back here afterwards.
 */
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
  // The round translucent form that sits on a card's picture; without it
  // the button is sized like the other actions of the detail view.
  overlay: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const route = useRoute();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const notification = useNotification();

const reference = computed(() => referenceOf(props.item, props.isEvent));
const hasTarget = computed(
  () => !!reference.value.tenantId && !!reference.value.targetId,
);
const signedIn = computed(() => authStore.isLoggedIn);
const active = computed(
  () => signedIn.value && favoritesStore.isFavorite(reference.value),
);
const pending = computed(() => favoritesStore.isPending(reference.value));

const label = computed(() => {
  if (!signedIn.value) return t("favorites.signInToMark");
  return active.value ? t("favorites.remove") : t("favorites.add");
});

// The list is loaded once the session is known; the store answers every
// card on the page with the same request, and again after a sign-in.
onMounted(() => {
  if (signedIn.value) favoritesStore.fetchFavorites();
});
watch(signedIn, (isSignedIn) => {
  if (isSignedIn) favoritesStore.fetchFavorites();
});

async function toggle() {
  if (!signedIn.value) {
    await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`);
    return;
  }
  if (pending.value) return;

  try {
    if (active.value) {
      await favoritesStore.unmark(reference.value);
    } else {
      await favoritesStore.mark(reference.value);
    }
  } catch (error) {
    report(error);
  }
}

function report(error) {
  const code = favoriteErrorCodeOf(error);
  if (code === FAVORITE_LIMIT_REACHED || error?.statusCode === 409) {
    const { limit } = favoriteErrorParamsOf(error);
    notification.warning(
      limit
        ? t("favorites.limitReached", { limit })
        : t("favorites.limitReachedShort"),
      t("favorites.limitReachedTitle"),
    );
    return;
  }
  // The offer is out of the user's reach: the heart stays empty.
  if (error?.statusCode === 404) {
    notification.info(t("favorites.notAvailable"));
    return;
  }
  // A dead session is handled by the API client itself.
  if (error?.statusCode === 401) return;
  notification.error(t("favorites.failed"));
}
</script>

<style scoped></style>
