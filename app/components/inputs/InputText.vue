<template>
  <div class="w-full group content-center dark:bg-gray-700">
    <div class="flex justify-between">
      <UInput
          v-model="model"
          :icon="icon"
          size="lg"
          variant="ghost"
          :placeholder="props.placeholder"
          class="w-full bg-white dark:bg-gray-700"
          :ui="{
        base: 'w-full pr-1 hover:bg-transparent rounded-none rounded-l-md',
        placeholder: 'bg-green-100 text-gray-400 dark:text-pink-500',
        leadingIcon: 'text-gray-400 dark:text-pink-500',
        trailing: 'p-0 text-color-red-800',
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
