<template>
  <UModal v-model:open="isOpen">
    <UChip :show="hasFilters" inset>
      <UButton
        label="Filtern"
        icon="i-lucide-funnel"
        color="neutral"
        variant="soft"
        class="rounded-full py-2 px-3"
        @click="() => (isOpen = true)"
      />
    </UChip>

    <template #content>
      <UCard>
        <div class="flex justify-end items-center">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            class="rounded-xl"
            @click="() => (isOpen = false)"
          />
        </div>
        <FilterArea
          v-model:is-initailized="isInitialized"
          :bookables="bookables"
          :include-non-suitable="includeNonSuitable"
          :categories="categories"
          :cities="cities"
          :distance="distance"
          :price="price"
          :only-public-events="onlyPublicEvents"
          :only-registration-needed-events="onlyRegistrationNeededEvents"
          :custom-fields="customFields"
          use-as-dialog
          :is-event="isEvent"
          @filter="onFilter"
        />
      </UCard>
    </template>
  </UModal>
</template>
<script setup>
import FilterArea from "./FilterArea.vue";
import { useRoute } from "#imports";

const isInitialized = defineModel("isInitailized", { type: Boolean });
defineProps({
  bookables: {
    type: Array,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
  includeNonSuitable: {
    type: Boolean,
    default: false,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  cities: {
    type: Array,
    default: () => [],
  },
  distance: {
    type: Number,
    default: null,
  },
  price: {
    type: Array,
    default: () => [],
  },
  onlyPublicEvents: {
    type: Boolean,
    default: true,
  },
  onlyRegistrationNeededEvents: {
    type: Boolean,
    default: false,
  },
  customFields: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["filter"]);
const isOpen = ref(false);

const hasFilters = computed(() => {
  const route = useRoute();
  const keysToCheck = [
    "inclNoSuitable",
    "pubEv",
    "regEv",
    "cities",
    "categories",
    "price",
  ];
  return route.query && keysToCheck.some((key) => key in route.query);
});

function onFilter(criteria) {
  isOpen.value = false;
  emit("filter", criteria);
}
</script>

<style scoped></style>
