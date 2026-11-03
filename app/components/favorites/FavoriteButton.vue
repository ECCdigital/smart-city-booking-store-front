<template>
  <!-- A wrapper takes the parent's placement classes: the tooltip renders
       its trigger as the button itself and has no root of its own. -->
  <div v-if="hasTarget" class="inline-flex">
    <span
      class="favorite-button relative inline-flex"
      :class="[heartColor, { 'is-bursting': bursting }]"
    >
      <UTooltip :text="label" :delay-duration="400">
        <UButton
          :icon="active ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
          :aria-label="label"
          :aria-pressed="active ? 'true' : 'false'"
          :aria-busy="pending ? 'true' : 'false'"
          color="neutral"
          :variant="overlay ? 'ghost' : 'outline'"
          :size="overlay ? 'lg' : 'xl'"
          :class="[
            overlay
              ? 'rounded-full bg-gray-100/85 dark:bg-gray-800/85 shadow hover:bg-white dark:hover:bg-gray-800'
              : 'justify-center px-3',
            heartColor,
            'cursor-pointer',
          ]"
          @click.stop.prevent="toggle"
        />
      </UTooltip>
      <!-- On marking, the heart pops and short rays in its colour burst out
           of it, in place of a loading spinner. -->
      <span
        v-if="bursting"
        class="favorite-burst pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <span
          v-for="angle in RAY_ANGLES"
          :key="angle"
          class="favorite-ray"
          :style="{ '--angle': `${angle}deg` }"
        />
      </span>
    </span>
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
  // A view that removes in its own way — the favorites page, which takes
  // the card out with a chance to undo — hands the removal over here; the
  // button then neither writes nor notifies on an active heart.
  removeWith: {
    type: Function,
    default: null,
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
const heartColor = computed(() =>
  active.value
    ? "text-red-500 dark:text-red-400"
    : "text-gray-600 dark:text-gray-300",
);

// Marking plays the burst once and to its end, also when the write is done
// sooner; a refused write stops it at once. Removing has no animation.
// BURST_MS is the length of the keyframes below, keep both in step.
const BURST_MS = 700;
const RAY_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);
const bursting = ref(false);
let burstTimer = null;

function startBurst() {
  stopBurst();
  bursting.value = true;
  burstTimer = setTimeout(() => {
    bursting.value = false;
    burstTimer = null;
  }, BURST_MS);
}

function stopBurst() {
  clearTimeout(burstTimer);
  burstTimer = null;
  bursting.value = false;
}

onBeforeUnmount(stopBurst);

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

  stopBurst();
  try {
    if (active.value && props.removeWith) {
      props.removeWith(reference.value);
    } else if (active.value) {
      await favoritesStore.unmark(reference.value);
      notification.info(
        t("favorites.removeMessage"),
        t("favorites.removeTitle"),
      );
    } else {
      startBurst();
      await favoritesStore.mark(reference.value);
      notification.info(t("favorites.addMessage"), t("favorites.addTitle"));
    }
  } catch (error) {
    stopBurst();
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

<style scoped>
/* The heart dips, swells and settles again (0.7s); the rays leave it at the
   top of the swell. */
.favorite-button.is-bursting :deep(.iconify) {
  animation: favorite-pop 0.7s ease-in-out;
}

@keyframes favorite-pop {
  0%,
  100% {
    transform: scale(1);
  }
  15% {
    transform: scale(0.85);
  }
  45% {
    transform: scale(1.2);
  }
}

/* Each ray starts near the heart, grows while it flies out and shrinks to
   nothing at its far end. */
.favorite-ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2px;
  height: 6px;
  margin: -3px 0 0 -1px;
  border-radius: 9999px;
  background: currentColor;
  opacity: 0;
  animation: favorite-ray 0.45s ease-out 0.2s;
}

@keyframes favorite-ray {
  0% {
    transform: rotate(var(--angle)) translateY(-9px) scaleY(0);
    opacity: 1;
  }
  40% {
    transform: rotate(var(--angle)) translateY(-14px) scaleY(1);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--angle)) translateY(-20px) scaleY(0);
    opacity: 1;
  }
}

/* Without motion the heart only fades a little for as long as the burst
   would play. */
@media (prefers-reduced-motion: reduce) {
  .favorite-burst {
    display: none;
  }

  .favorite-button.is-bursting :deep(.iconify) {
    animation: none;
  }

  .favorite-button :deep(button) {
    transition: opacity 0.2s ease;
  }

  .favorite-button.is-bursting :deep(button) {
    opacity: 0.5;
  }
}
</style>
