<template>
  <div class="w-full group content-center bg-surface-raised">
    <div class="flex justify-between">
      <UInput
        v-model="model"
        :icon="icon"
        size="lg"
        variant="ghost"
        :placeholder="props.placeholder"
        class="w-full bg-surface-raised"
        :ui="{
          base: 'w-full pr-1 hover:bg-transparent rounded-none rounded-l-md',
          placeholder: 'text-gray-400 dark:text-gray-200',
          leadingIcon: 'text-gray-400 dark:text-gray-200',
        }"
      />
      <ClearButton :show-clear-button="!!model" @clear="model = ''" />
    </div>
  </div>
</template>
<script setup>
import ClearButton from "~/components/inputs/ClearButton.vue";

const model = defineModel();

const props = defineProps({
  icon: {
    type: String,
    default: null,
  },
  placeholder: {
    type: String,
    default: null,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped></style>
