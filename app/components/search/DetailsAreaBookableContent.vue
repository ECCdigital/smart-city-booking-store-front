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
      <div class="grid content-center">
        <UButton
          v-if="item.isBookable"
          label="Jetzt buchen"
          icon="i-lucide-shopping-cart"
          class="justify-center px-5 mt-5 md:my-0"
          :style="{ color: contrastToPrimary, cursor: 'pointer' }"
          @click="goToCheckout()"
        />
        <UButton
          v-else-if="item.relatedBookableIds.length > 0"
          label="Buchungsoptionen ansehen"
          icon="i-lucide-list"
          class="justify-center px-5 mt-5 md:my-0"
          :style="{ color: contrastToPrimary, cursor: 'pointer' }"
          @click="goToRelatedItems()"
        />
      </div>
    </div>

    <div class="md:flex">
      <div class="md:mr-20 mb-10 basis-2/3">
        <BookablesBookableAdressInformation
          :bookable="item"
          class="md:hidden mt-5"
        />
        <BookableFlagDisplay
          :flags="item?.flags"
          :badges="badgeFieldLabels"
          is-detail-mode
          class="my-5"
        />

        <!-- Description -->
        <div>
          <div
            class="line-clamp-3 md:line-clamp-none"
            v-html="htmlDescription"
          />

          <!-- Custom Fields: unterhalb der Beschreibung -->
          <dl v-if="belowDescriptionFields.length" class="mt-4 space-y-1">
            <div
              v-for="field in belowDescriptionFields"
              :key="field.id"
              class="flex gap-2"
            >
              <dt class="font-semibold">{{ field.caption }}:</dt>
              <dd>
                <template v-if="field.inputType === 'boolean'">Ja</template>
                <template v-else>{{ customFieldValueText(field) }}</template>
              </dd>
            </div>
          </dl>
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
        <AddressInformationArea
          :is-event="false"
          :item="item"
          class="md:hidden mb-5"
        />

        <!-- Availability -->
        <DetailsAvailabilitySection
          :bookable="item"
          :time-period="timePeriod"
          @period-selected="setSearchTimePeriod"
          @period-cleared="removeSearchTimePeriod"
        />
        <div
          v-if="showAvailabilityResult"
          class="bg-surface-muted border border-surface-border shadow-sm rounded-lg p-3 mb-2 md:flex justify-between content-center"
        >
          <div class="font-bold mr-1 content-center line-clamp-2">
            {{ item?.title }}
          </div>
          <div class="flex justify-end mt-3 md:mt-0 ml-2">
            <BookablePriceDisplay
              v-if="items.length > 0"
              :bookable="items[0].item"
              :calculated-price="items[0].calculatedPrice"
              class="mx-2 font-bold content-center w-20"
            />
            <div class="content-center">
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
        </div>

        <!-- Related Bookables -->
        <div
          v-if="item.relatedBookables && item.relatedBookables.length"
          id="relatedBookables"
        >
          <h3 class="text-xl font-bold">Könnte Sie auch interessieren:</h3>
        </div>
        <BookableRelatedItems :related-bookables="item.relatedBookables" />
      </div>

      <!-- Price Information & Map -->
      <div class="basis-1/3 space-y-3 pt-5">
        <AddressInformationArea
          :is-event="false"
          :item="item"
          class="hidden md:block"
        />
        <PriceInformationArea
          :is-event="false"
          :item="item"
          class="hidden md:block"
        />

        <!-- Custom Fields: Mehr Informationen -->
        <div
          v-if="moreInfoFields.length"
          class="bg-surface-muted rounded-md p-3"
        >
          <h3 class="font-bold mr-1 content-center line-clamp-2">
            Weitere Informationen
          </h3>
          <dl class="space-y-2">
            <div
              v-for="field in moreInfoFields"
              :key="field.id"
              class="flex justify-between gap-2"
            >
              <dt>{{ field.caption }}</dt>
              <dd class="text-right">
                <template v-if="field.inputType === 'boolean'">Ja</template>
                <template v-else>{{ customFieldValueText(field) }}</template>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useTenantStore } from "~~/stores/tenant.js";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState.js";
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";
import { useBookableBookingMode } from "~/composables/useBookableBookingMode";
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";
import AddressInformationArea from "~/components/AddressInformationArea.vue";
import PriceInformationArea from "~/components/PriceInformationArea.vue";
import BookableRelatedItems from "~/components/bookables/BookableRelatedItems.vue";
import DetailsAvailabilitySection from "~/components/search/DetailsAvailabilitySection.vue";

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

const detailFields = computed(() => {
  const fields = props.item?.customFields || [];
  return fields.filter((field) => {
    const position = field?.usageOptions?.detailDisplayPosition;
    if (!position || position === "none") return false;
    if (!field.hasValue) return false;
    // boolean fields only make sense as a positive marker (e.g. "WLAN")
    if (field.inputType === "boolean") {
      return field.value === true || field.value === "true";
    }
    return (
      field.value !== null && field.value !== undefined && field.value !== ""
    );
  });
});

function fieldsByPosition(position) {
  return detailFields.value.filter(
    (field) => field.usageOptions.detailDisplayPosition === position,
  );
}

const badgeFields = computed(() => fieldsByPosition("badge"));
const belowDescriptionFields = computed(() =>
  fieldsByPosition("belowDescription"),
);
const moreInfoFields = computed(() => fieldsByPosition("moreInfo"));

const badgeFieldLabels = computed(() =>
  badgeFields.value.map(customFieldBadgeLabel),
);

function customFieldValueText(field) {
  if (field.inputType === "select") {
    const option = (field.options || []).find(
      (opt) => String(opt.value) === String(field.value),
    );
    return option?.caption ?? field.value;
  }
  return field.value;
}

function customFieldBadgeLabel(field) {
  if (field.inputType === "boolean") {
    return field.caption;
  }
  return `${field.caption}: ${customFieldValueText(field)}`;
}

const timePeriod = ref({
  start: query.start,
  end: query.end,
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.item.tenantId).name;
});

const { requiresTimeSelection } = useBookableBookingMode(() => props.item);

const isBookable = computed(() => {
  const entry = items.value[0];
  if (!entry) return false;
  return entry.matchStatus === "match" && entry.isBookable !== false;
});

const hasValidTimePeriod = computed(() => {
  const start = timePeriod.value?.start;
  const end = timePeriod.value?.end;
  if (!start || !end) return false;
  return new Date(end).getTime() > new Date(start).getTime();
});

const showAvailabilityResult = computed(() => {
  if (!requiresTimeSelection.value) {
    return items.value.length > 0;
  }
  return hasValidTimePeriod.value;
});

const { contrastToPrimary } = useContrastColor();

async function setSearchTimePeriod(tp) {
  timePeriod.value = tp;
  await runSearch({
    term: "",
    location: "",
    timeStart: timePeriod.value.start,
    timeEnd: timePeriod.value.end,
  });
}
function removeSearchTimePeriod() {
  timePeriod.value = { start: null, end: null };
  resetResults();
}

onMounted(async () => {
  if (hasValidTimePeriod.value) {
    await runSearch({
      term: "",
      location: "",
      timeStart: timePeriod.value.start,
      timeEnd: timePeriod.value.end,
    });
    return;
  }

  if (!requiresTimeSelection.value) {
    await runSearch({
      term: "",
      location: "",
      timeStart: null,
      timeEnd: null,
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
      start: hasValidTimePeriod.value
        ? timePeriod.value.start
        : route.query.start,
      end: hasValidTimePeriod.value ? timePeriod.value.end : route.query.end,
      url: props.item.checkoutUrl,
    });
  }
}
function goToRelatedItems() {
  const el = document.getElementById("relatedBookables");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}
</script>
<style scoped></style>
