<template>
  <div
    v-if="showClearButton"
    class="rounded-r content-center xl:pr-3 transition-colors group-focus-within:bg-gray-100 dark:group-focus-within:bg-gray-800"
  >
    <UTooltip text="Eintrag löschen">
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        icon="i-lucide-circle-x"
        aria-label="Clear input"
        class=""
        @click="onClear"
      />
    </UTooltip>
  </div>
</template>
<script setup>
const props = defineProps({
  showClearButton: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["clear"]);

function onClear() {
  emit("clear");
}
</script>
<style scoped></style>
