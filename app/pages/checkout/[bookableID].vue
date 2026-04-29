<script setup>
import { useCheckout } from "~/composables/api/useCheckout.js";
import DetailsAreaImages from "~/components/search/DetailsAreaImages.vue";

definePageMeta({
  layout: "checkout",
});

const bookableID = useRoute().params.bookableID;
const tenantID = useRoute().query.tenantId;

const leadBookable = ref(null);
const loading = ref(true);

const { fetchBookable } = useCheckout();

const selectedDurationHours = ref(2);
const selectedExtras = ref([]);

const money = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const bookableTypeLabel = computed(() => {
  switch (leadBookable.value?.type) {
    case "room":
      return "RAUMBUCHUNG";
    case "event":
      return "EVENTBUCHUNG";
    default:
      return "BUCHUNG";
  }
});

const pricePerHour = computed(() => {
  return leadBookable.value?.priceCategories?.[0]?.priceEur ?? 0;
});

const priceLabel = computed(() => {
  return money.format(pricePerHour.value);
});

const priceUnitLabel = computed(() => {
  return leadBookable.value?.priceType === "per-hour" ? "/ Stunde" : "";
});

const bookableNetTotal = computed(() => {
  return pricePerHour.value * selectedDurationHours.value;
});

const extrasTotal = computed(() => {
  return selectedExtras.value.reduce((sum, extra) => {
    return sum + Number(extra?.amount ?? extra?.priceEur ?? 0);
  }, 0);
});

const netTotal = computed(() => {
  return bookableNetTotal.value + extrasTotal.value;
});

const vatRate = computed(() => {
  return leadBookable.value?.priceValueAddedTax ?? 0;
});

const vatTotal = computed(() => {
  return netTotal.value * (vatRate.value / 100);
});

const total = computed(() => {
  return netTotal.value + vatTotal.value;
});

const visibleFeatureBadges = computed(() => {
  const badges = [];

  if (leadBookable.value?.flags?.length) {
    badges.push(...leadBookable.value.flags);
  }

  const roomSize = leadBookable.value?.customFields?.find(
    (field) => field.id === "room_size" && field.hasValue
  );

  if (roomSize?.value) {
    badges.push(`bis ${roomSize.value} Personen`);
  }

  return badges;
});

onMounted(async () => {
  if (bookableID && tenantID) {
    try {
      loading.value = true;
      const bookable = await fetchBookable(bookableID, tenantID);
      leadBookable.value = bookable;
    } catch (error) {
      console.error("Error fetching bookable:", error);
    } finally {
      loading.value = false;
    }
  }
});
</script>

<template>
  <div class="min-h-screen w-full bg-neutral-50 dark:bg-gray-950">
    <div v-if="!leadBookable" class="flex justify-center py-20">
      <div v-if="loading" class="text-center">
        <UIcon
          size="48"
          name="i-lucide-loader-2"
          class="mb-4 animate-spin text-gray-400"
        />
        <p class="text-gray-500">{{ $t("common.loading") }}</p>
      </div>

      <div v-else class="mt-10 text-center lg:mt-25">
        <UIcon
          size="48"
          name="i-lucide-shopping-cart"
          class="mb-4 text-gray-400"
        />
        <p class="text-gray-500">{{ $t("checkout.noBookable") }}</p>
      </div>
    </div>

    <div
      v-else
      class="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2"
    >
      <div
        class="border-r border-gray-200 px-6 py-8 dark:border-gray-800 lg:px-12"
      >
        <div
          class="mb-4 inline-flex rounded-md bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
        >
          {{ bookableTypeLabel }}
        </div>

        <p class="mb-2 text-lg font-semibold text-gray-500 dark:text-gray-400">
          {{ leadBookable.tenantId }}
        </p>

        <h1
          class="max-w-2xl text-4xl font-extrabold leading-tight text-gray-950 dark:text-white"
        >
          {{ leadBookable.title }}
        </h1>

        <div class="mt-4 flex items-end gap-2">
          <span
            class="text-5xl font-extrabold tracking-tight text-gray-950 dark:text-white"
          >
            {{ priceLabel }}
          </span>
          <span
            class="mb-2 text-base font-semibold text-gray-500 dark:text-gray-400"
          >
            {{ priceUnitLabel }}
          </span>
        </div>

        <DetailsAreaImages :item="leadBookable" class="mt-12" />

        <div
          v-if="visibleFeatureBadges.length"
          class="mt-6 flex flex-wrap gap-3"
        >
          <div
            v-for="badge in visibleFeatureBadges"
            :key="badge"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <UIcon name="i-lucide-check" class="text-blue-500" />
            {{ badge }}
          </div>
        </div>

        <div
          class="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div
            class="space-y-3 text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            <div class="flex justify-between gap-4">
              <span>Raum ({{ selectedDurationHours }} Std.)</span>
              <span>{{ money.format(bookableNetTotal) }}</span>
            </div>

            <div
              v-for="extra in selectedExtras"
              :key="extra.id"
              class="flex justify-between gap-4"
            >
              <span>{{ extra.title }}</span>
              <span>{{
                money.format(Number(extra.amount ?? extra.priceEur ?? 0))
              }}</span>
            </div>

            <div class="flex justify-between gap-4">
              <span>MwSt. ({{ vatRate }}%)</span>
              <span>{{ money.format(vatTotal) }}</span>
            </div>
          </div>

          <div class="my-4 border-t border-gray-200 dark:border-gray-800" />

          <div
            class="flex justify-between gap-4 text-xl font-extrabold text-gray-950 dark:text-white"
          >
            <span>Gesamt</span>
            <span class="text-blue-500">{{ money.format(total) }}</span>
          </div>
        </div>
      </div>

      <div class="px-6 py-8 lg:px-12"></div>
    </div>
  </div>
</template>

<style scoped></style>
