<template>
  <div
    class="basis-3/4 flex flex-col justify-between gap-2"
    :class="mapMode ? 'p-2' : 'p-4'"
  >
    <div class="flex flex-col gap-2">
      <!-- Title -->
      <div class="cursor-pointer" @click="openDetails()">
        <p
          class="font-bold"
          :class="
            mapListMode
              ? 'text-base line-clamp-2'
              : hasLongTitle
                ? 'text-base line-clamp-2'
                : 'text-lg'
          "
        >
          {{ bookable?.title }}
        </p>
        <p :class="mapListMode ? 'text-sm' : ''">
          {{ getTenantName(bookable.tenantId) }}
        </p>
      </div>

      <!-- Adresse, Entfernung und Beschreibung -->
      <div
        v-if="!mapListMode || hasDescription"
        class="w-full flex flex-col gap-1"
      >
        <BookableAdressInformation
          v-if="!mapListMode"
          :bookable="bookable"
          show-distance
          class="w-full"
          :class="mapMode ? 'text-sm' : ''"
        />
        <div
          v-if="hasDescription"
          class="text-sm line-clamp-3"
          v-html="htmlDescription"
        />
      </div>

      <USeparator
        v-if="!mapMode"
        color="neutral"
        class="w-full"
        :ui="{ border: 'border-gray-300' }"
      />
    </div>

    <div
      class="flex gap-2"
      :class="mapMode ? 'justify-start' : 'justify-between items-end'"
    >
      <!-- Eigenschaften -->
      <div v-if="!mapMode && hasFlags" class="basis-3/5 min-w-0 self-center">
        <BookableFlagDisplay :flags="bookable?.flags" class="line-clamp-3" />
      </div>

      <div
        v-if="!mapListMode"
        class="content-end"
        :class="mapMode ? 'w-full' : 'basis-2/5 ml-auto grid'"
      >
        <!-- Preis -->
        <BookablePriceDisplay
          v-if="!isNotBookable && !isNotSuitable"
          :bookable="bookable"
          :calculated-price="calculatedPrice"
          :is-map-stripe="mapMode"
          class="font-bold"
        />

        <!--Aktionen-->
        <div
          v-if="!entryPageMode && !mapMode"
          class="w-full mt-2 flex justify-end content-end gap-2"
        >
          <UButton
            label="Details ansehen"
            variant="outline"
            class="justify-center px-10 text-color-dark dark:text-color-light"
            :style="{ cursor: 'pointer' }"
            @click="openDetails"
          />
          <UTooltip
            :show="isNotBookable"
            :text="$t('bookableDetail.checkOptionsHint')"
          >
            <UButton
              v-if="!isNotSuitable && !entryPageMode"
              label="Buchen"
              class="justify-center px-10"
              :disabled="isNotBookable"
              :style="{
                color: contrastToPrimary,
                cursor: isNotBookable ? '' : 'pointer',
              }"
              @click="goToCheckout"
            />
          </UTooltip>
        </div>

        <div
          v-else-if="!mapMode"
          class="w-full mt-2 flex justify-end content-end gap-2"
        >
          <UButton
            v-if="!isNotBookable"
            label="Details ansehen"
            variant="solid"
            class="justify-center px-10 text-color-dark dark:text-color-light"
            :style="{ cursor: 'pointer', color: contrastToPrimary }"
            @click="openDetails"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import BookableAdressInformation from "~/components/bookables/BookableAdressInformation.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  searchParams: {
    type: Object,
    default: null,
  },
  calculatedPrice: {
    type: Object,
    default: null,
  },
  isNotSuitable: {
    type: Boolean,
    default: false,
  },
  isNotBookable: {
    type: Boolean,
    default: false,
  },
  entryPageMode: {
    type: Boolean,
    default: false,
  },
  mapMode: {
    type: Boolean,
    default: false,
  },
  mapListMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["openDetails"]);

const hasLongTitle = computed(() => {
  return (props.bookable?.title?.length ?? 0) > 60;
});
const { sanitizeHtml } = useSanitizeHtml();
const htmlDescription = computed(() => {
  return sanitizeHtml(props.bookable?.description || "");
});
// Markup alone is not content: an empty paragraph from the editor must not
// reserve three lines in the strip.
const hasDescription = computed(
  () =>
    htmlDescription.value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0,
);

const hasFlags = computed(() => (props.bookable?.flags?.length ?? 0) > 0);

const { getTenantName } = useTenant();

const { contrastToPrimary } = useContrastColor();

function openDetails() {
  emit("openDetails", props.bookable.id, props.bookable.type);
}

function goToCheckout() {
  const route = useRoute();
  useCheckoutRedirect().redirectToCheckout({
    id: props.bookable.id,
    tenantId: props.bookable.tenantId,
    start: route.query.start,
    end: route.query.end,
    url: props.bookable.checkoutUrl,
  });
}
</script>
<style scoped></style>
