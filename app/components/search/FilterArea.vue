<template>
  <div :class="useAsDialog ? '' : 'my-2 p-2 border border-gray-200 rounded'">
    <p class="my-4 font-bold">Ergebnisse filtern</p>
    <USeparator v-if="!useAsDialog" class="border-gray-200" />
    <div class="my-4">
      <p>Kategorie</p>
      ...
      <br />
      <br />

      <p>Preis</p>
      ...
      <br />
      <br />
      <p>Distanz</p>
      ...
      <br />
    </div>
    <div class="flex justify-end">
      <UButton
        label="Filtern"
        icon="i-lucide-funnel"
        color="neutral"
        variant="soft"
        class="rounded-full py-2 px-3"
        @click="onFilter"
      />
    </div>
  </div>
</template>
<script setup>
const emit = defineEmits(["filter", "closeDialog"]);

const props = defineProps({
  useAsDialog: {
    type: Boolean,
    default: false,
  },
});
function onFilter() {
  emit("filter");
}
</script>
<style scoped></style>
