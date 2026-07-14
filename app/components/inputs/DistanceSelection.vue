<template>
  <div
    class="content-center bg-surface-raised group-focus-within:bg-surface-muted dark:group-focus-within:bg-surface-muted"
  >
    <USelect
      v-model="distance"
      :items="distanceOptions"
      variant="ghost"
      :ui="{
        base: 'placeholder:text-gray-400 dark:text-gray-200 hover:bg-transparent flex items-center gap-1',
        content: 'w-30 glass',
        trailing: 'pl-0 pr-1',
      }"
      class="w-full px-2 text-xs"
      @change="setDistance"
    >
      <template #default>
        <span class="whitespace-nowrap">+ {{ distance }} km</span>
      </template>
      <template #item="{ item }"> + {{ item }} km</template>
    </USelect>
  </div>
</template>
<script setup>
const distance = defineModel();

const emit = defineEmits(["setDistance"]);

const distanceOptions = ref([5, 10, 20, 30, 50, 100, 150, 200]);

function setDistance() {
  emit("setDistance", distance.value);
}
</script>

<style scoped></style>
