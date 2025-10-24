<template>
  <UPopover
    v-model:open="isOpen"
    :content="{ align: 'end', side: 'bottom', sideOffset: '-20' }"
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
      <UCard style="width: 80vw">
        <div class="flex justify-end items-center">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            class="rounded-xl"
            @click="() => (isOpen = false)"
          />
        </div>
        <FilterArea useAsDialog @filter="onFilter" />
      </UCard>
    </template>
  </UPopover>
</template>
<script setup>
import FilterArea from "./FilterArea.vue";

const emit = defineEmits(["filter"]);
const isOpen = ref(false);

function onFilter() {
  isOpen.value = false;
  emit("filter");
}
</script>

<style scoped></style>
