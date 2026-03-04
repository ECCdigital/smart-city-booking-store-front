<template>
  <div class="">
    <!-- Title -->
    <div class="md:flex justify-between">
      <div>
        <p class="text-sm font-bold text-primary">
          {{ tenantName }}
        </p>
        <h2 class="text-2xl font-bold">{{ item?.title }}</h2>
      </div>
      <UButton
        label="Jetzt buchen"
        icon="i-lucide-shopping-cart"
        class="justify-center px-5 mt-5 md:my-0"
        :style="{ color: contrastToPrimary, cursor: 'pointer' }"
        @click="goToCheckout()"
      />
    </div>

    <div class="md:flex">
      <div class="md:mr-20 mb-10 basis-2/3">
        <BookablesBookableAdressInformation
          :bookable="item"
          class="md:hidden mt-5"
        />
        <BookableFlagDisplay :flags="item?.flags" is-detail-mode class="my-5" />

        <!-- Description -->
        <div>
          <div
            class="line-clamp-3 md:line-clamp-none"
            v-html="htmlDescription"
          />
          <div class="flex justify-end md:hidden">
            <UButton
              label="Alles ansehen"
              variant="ghost"
              class="mt-2"
              @click="showFullDescription = true"
            />
          </div>

          <UModal
            v-model:open="showFullDescription"
            :title="'Beschreibung von ' + item?.title"
            size="lg"
            class="max-h-[80vh]"
            :ui="{ overlay: 'backdrop-blur-md' }"
          >
            <template #body>
              <div class="p-4" v-html="htmlDescription" />
            </template>
          </UModal>
        </div>
        <USeparator
          class="w-full my-5 md:my-10"
          :ui="{ border: 'border-gray-300' }"
        />

        <!-- Price Information & Map (sm-view) -->
        <PriceInformationArea
          :is-event="false"
          :item="item"
          class="md:hidden mb-2"
        />
        <AddressInformationArea :is-event="false" :item="item" class="md:hidden mb-5"/>


        <!-- Availability -->
        <div>
          <h3 class="text-xl font-bold">Verfügbarkeit</h3>
          <UAlert
            v-if="!timePeriod || (!timePeriod.start && !timePeriod.end)"
            title="Wählen Sie Daten aus, um die Verfügbarkeit und Preise zu sehen."
            icon="i-lucide-info"
            variant="ghost"
            class="p-2 text-info w-full"
          />
          <InputTimePeriod
            :time-period="timePeriod"
            class="border dark:border-gray-600  rounded-lg mt-2 mb-5 w-full"
            @select-date="setSearchTimePeriod"
            @remove-date="removeSearchTimePeriod"
          />
        </div>
        <div
          v-if="timePeriod && timePeriod.start && timePeriod.end"
          class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 mb-2 flex content-center"
        >
          <span class="font-bold mr-1 content-center">{{ item?.title }}</span>
          <span class="content-center">
            {{ unit }}
          </span>
          <div class="flex-1" />
          <BookablePriceDisplay
            v-if="items.length > 0"
            :bookable="items[0].item"
            :calculated-price="items[0].calculatedPrice"
            class="mx-2 font-bold content-center"
          />

          <UButton
            v-if="isBookable"
            label="Buchen"
            class="justify-center px-5"
            :style="{ color: contrastToPrimary }"
            @click="goToCheckout()"
          />
          <UButton
            v-else
            label="Nicht verfügbar"
            variant="soft"
            class="justify-center px-5"
            :style="{ color: contrastToPrimary }"
          />
        </div>
      </div>

      <!-- Price Information & Map -->
      <div class="basis-1/3 space-y-3 pt-5">
        <AddressInformationArea :is-event="false" :item="item" class="hidden md:block"/>
        <PriceInformationArea
          :is-event="false"
          :item="item"
          class="hidden md:block"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useTenantStore } from "~~/stores/tenant.js";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import InputTimePeriod from "~/components/inputs/InputTimePeriod.vue";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState.js";
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";
import AddressInformationArea from "~/components/AddressInformationArea.vue";
import PriceInformationArea from "~/components/PriceInformationArea.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { state: query } = useCatalogQueryState();
const {
  updatedItems: items,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: false, sourceItems: [props.item] });

const { sanitizeHtml } = useSanitizeHtml();
const htmlDescription = computed(() => {
  return sanitizeHtml(props.item.description || "");
});
const showFullDescription = ref(false);

const timePeriod = ref({
  start: query.start,
  end: query.end,
});
const unit = computed(() => {
  if (!timePeriod.value) {
    return "";
  }

  const type = props.item?.priceType;

  const diffMs = timePeriod.value.end - timePeriod.value.start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (type === "per-day") {
    if (diffDays > 1) {
      return "/ " + diffDays + " Tage";
    } else {
      return "/ " + diffDays + " Tag";
    }
  }

  if (type === "per-hour" && diffHours) {
    return "/ " + diffHours + " Std.";
  }
  return " ";
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.item.tenantId).name;
});

const isBookable = computed(() => {
  if (items.value.length === 1 && items.value[0].status === "bookable") {
    return true;
  } else if (items.value.length === 1 && items.value[0].status === "suitable") {
    return true;
  }
  return false;
});

const { contrastToPrimary } = useContrastColor();


async function setSearchTimePeriod(tp) {
  timePeriod.value = tp;
  await runSearch({
    term: "",
    location: "",
    timeStart: timePeriod.value.start,
    timeEnd: timePeriod.value.end,
    isEvent: false,
  });
}
function removeSearchTimePeriod() {
  timePeriod.value = null;
  resetResults();
}
onMounted(async () => {
  if (timePeriod.value.start && timePeriod.value.end) {
    await runSearch({
      term: "",
      location: "",
      timeStart: timePeriod.value.start,
      timeEnd: timePeriod.value.end,
      isEvent: false,
    });
  }
});

function goToCheckout(checkoutData) {
  if (checkoutData) {
    useCheckoutRedirect().redirectToCheckout(checkoutData);
  } else {
    const route = useRoute();
    useCheckoutRedirect().redirectToCheckout({
      id: props.item.id,
      tenantId: props.item.tenantId,
      start: route.query.start,
      end: route.query.end,
    });
  }
}
</script>
<style scoped></style>
