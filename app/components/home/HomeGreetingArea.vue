<template>
  <!-- Only for a signed-in person; everything in it is theirs alone. -->
  <section
    v-if="authStore.isLoggedIn"
    class="mt-10 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 md:p-5"
    :aria-label="$t('home.greeting.label')"
  >
    <p class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span class="text-lg font-bold text-gray-900 dark:text-white">
        {{ greeting }}
      </span>
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t("home.greeting.privacyHint") }}
      </span>
    </p>

    <ul class="m-0 p-0 list-none grid gap-3 md:grid-cols-3">
      <!-- Next booking -->
      <li :class="CARD">
        <p :class="CARD_TITLE">
          <UIcon name="i-lucide-calendar" class="size-4 text-primary" />
          {{ $t("home.greeting.nextBooking.title") }}
        </p>
        <template v-if="upcoming">
          <p class="font-semibold text-gray-900 dark:text-white line-clamp-2">
            {{ titleOf(upcoming) }}
          </p>
          <p :class="CARD_TEXT">
            {{ spanText(upcoming) }}
            <template v-if="tenantNameOf(upcoming)">
              · {{ tenantNameOf(upcoming) }}
            </template>
          </p>
          <NuxtLink
            :to="`/account/bookings/${upcoming.id}`"
            :class="CARD_LINK"
          >
            {{ $t("home.greeting.nextBooking.link") }}
            <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
          </NuxtLink>
        </template>
        <template v-else>
          <p :class="CARD_TEXT">
            {{
              bookingsLoaded
                ? $t("home.greeting.nextBooking.none")
                : $t("home.greeting.loading")
            }}
          </p>
          <NuxtLink to="/account/bookings" :class="CARD_LINK">
            {{ $t("home.greeting.nextBooking.all") }}
            <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
          </NuxtLink>
        </template>
      </li>

      <!-- Mobile Key -->
      <li v-if="instanceStore.usesDigitalKeys" :class="CARD">
        <p :class="CARD_TITLE">
          <UIcon name="i-lucide-key-round" class="size-4 text-primary" />
          {{ $t("home.greeting.key.title") }}
        </p>
        <template v-if="key">
          <p class="font-semibold text-gray-900 dark:text-white">
            {{
              key.state === "during"
                ? $t("home.greeting.key.activeTitle")
                : $t("home.greeting.key.readyTitle", {
                    day: weekdayDay(key.window.from),
                  })
            }}
          </p>
          <p :class="CARD_TEXT">
            {{
              key.state === "during"
                ? $t("home.greeting.key.activeText", {
                    time: formatTime(key.window.to),
                  })
                : $t("home.greeting.key.readyText", {
                    time: formatTime(key.window.from),
                  })
            }}
          </p>
        </template>
        <p v-else :class="CARD_TEXT">
          {{
            keysLoaded
              ? $t("home.greeting.key.none")
              : $t("home.greeting.loading")
          }}
        </p>
        <NuxtLink to="/mobile-key" :class="CARD_LINK">
          {{ $t("home.greeting.key.link") }}
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
        </NuxtLink>
      </li>

      <!-- Favorites -->
      <li :class="CARD">
        <p :class="CARD_TITLE">
          <UIcon name="i-lucide-heart" class="size-4 text-primary" />
          {{ $t("home.greeting.favorites.title") }}
        </p>
        <p class="font-semibold text-gray-900 dark:text-white">
          {{
            favoritesStore.initialized
              ? $t(
                  "home.greeting.favorites.count",
                  favoritesStore.references.length,
                )
              : $t("home.greeting.loading")
          }}
        </p>
        <NuxtLink to="/account/favorites" :class="CARD_LINK">
          {{ $t("home.greeting.favorites.link") }}
          <UIcon name="i-lucide-chevron-right" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { useAuthStore } from "~~/stores/auth.js";
import { useBookingStore } from "~~/stores/bookings.js";
import { useFavoritesStore } from "~~/stores/favorites.js";
import { useInstanceStore } from "~~/stores/instance.js";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { bookingSpan, nextBooking, nextKey } from "~/utils/homeGreeting.js";

const CARD =
  "flex flex-col gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4";
const CARD_TITLE =
  "flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1";
const CARD_TEXT = "text-sm text-gray-600 dark:text-gray-400";
const CARD_LINK =
  "mt-auto pt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline";

const { t } = useI18n();
const authStore = useAuthStore();
const bookingStore = useBookingStore();
const favoritesStore = useFavoritesStore();
const instanceStore = useInstanceStore();
const { getBookingTenant } = useTenant();
const { getAccessBookings } = useAccessPoints();
const { formatDay, formatTime } = useFormatting();

const greeting = computed(() => {
  const firstName = authStore.user?.firstName?.trim();
  return firstName
    ? t("home.greeting.helloName", { name: firstName })
    : t("home.greeting.hello");
});

// Read once on mount; the block does not tick along with the clock.
const now = ref(Date.now());

const bookingsLoaded = ref(false);
const upcoming = computed(() =>
  bookingsLoaded.value ? nextBooking(bookingStore.getBookings, now.value) : null,
);

const keysLoaded = ref(false);
const accessBookings = ref([]);
const key = computed(() => nextKey(accessBookings.value, now.value));

function titleOf(booking) {
  const titles = (booking.bookableItems || [])
    .map((item) => item._bookableUsed?.title)
    .filter(Boolean);
  return titles.length ? titles.join(", ") : booking.objectName || "";
}

function tenantNameOf(booking) {
  return getBookingTenant(booking)?.name || "";
}

function weekdayDay(time) {
  return formatDay(time, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: undefined,
  });
}

function spanText(booking) {
  const span = bookingSpan(booking);
  if (!span) return "";
  return `${weekdayDay(span.begin)}, ${formatTime(span.begin)} – ${formatTime(span.end)}`;
}

async function loadBookings() {
  await bookingStore.fetchBookings();
  bookingsLoaded.value = true;
}

async function loadKeys() {
  if (!instanceStore.usesDigitalKeys) return;
  try {
    const response = await getAccessBookings({
      filter: "all",
      includeEligibility: "true",
    });
    accessBookings.value = response?.data ?? response ?? [];
  } catch (error) {
    // The card says there is no key; the key page has the real error.
    console.error("[home] access bookings failed:", error);
  } finally {
    keysLoaded.value = true;
  }
}

function load() {
  if (!authStore.isLoggedIn) return;
  now.value = Date.now();
  loadBookings();
  loadKeys();
  favoritesStore.fetchFavorites();
}

onMounted(load);
watch(() => authStore.isLoggedIn, load);
</script>
