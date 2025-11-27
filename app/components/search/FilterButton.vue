<template>
  <UModal
      v-model:open="isOpen"
  >
    <UButton
      label="Filtern"
      icon="i-lucide-funnel"
      color="neutral"
      variant="soft"
      class="rounded-full py-2 px-3"
      @click="() => (isOpen = true)"
    />
    <template #content>
      <UCard >
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
            :bookables="props.bookables"
            is-event
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
});

const emit = defineEmits(["filter"]);
const isOpen = ref(false);

function onFilter(filteredBookables) {
  isOpen.value = false;
  emit("filter", filteredBookables);
}
</script>

<style scoped></style>
