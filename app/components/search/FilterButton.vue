<template>
  <UModal v-model:open="isOpen">
    <UButton
      label="Filtern"
      icon="i-lucide-funnel"
      color="neutral"
      variant="soft"
      class="rounded-full py-2 px-3"
      @click="() => (isOpen = true)"
    />
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
          :price="price"
          :only-public-events="onlyPublicEvents"
          :only-registered-events="onlyRegistrationNeededEvents"
          use-as-dialog
          @filter="onFilter"
        />
      </UCard>
    </template>
  </UModal>
</template>
<script setup>
import FilterArea from "./FilterArea.vue";

const isInitialized = defineModel("isInitailized", { type: Boolean });
const props = defineProps({
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
    default: true,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  cities: {
    type: Array,
    default: () => [],
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
});

const emit = defineEmits(["filter"]);
const isOpen = ref(false);

function onFilter(criteria) {
  isOpen.value = false;
  emit("filter", criteria);
}
</script>

<style scoped></style>
