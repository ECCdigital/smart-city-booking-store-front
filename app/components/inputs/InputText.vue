<template>
  <UInput
    v-model="model"
    :icon="icon"
    size="lg"
    variant="ghost"
    :placeholder="props.placeholder"
    class="w-full bg-white dark:bg-gray-700"
  >
    <template v-if="clearable && model?.length" #trailing>
      <UTooltip text="Eintrag löschen">
        <UButton
            color="neutral"
            variant="link"
            size="sm"
            icon="i-lucide-circle-x"
            aria-label="Clear input"
            @click="model = ''"
        />
      </UTooltip>
    </template>
  </UInput>
</template>
<script setup>
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
