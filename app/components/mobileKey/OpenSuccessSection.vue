<template>
  <div
    class="bg-success/40 w-24 h-24 z-15 rounded-full flex items-center justify-center"
  >
    <UIcon name="i-lucide-check" class="!text-[40px] text-gray-600" />
  </div>

  <div class="text-center text-sm mx-5">
    <p class="mb-1 text-lg font-semibold">Tür geöffnet!</p>
    {{ accessPointLabel }} ist jetzt entriegelt. Sie können eintreten.
  </div>
  <UButton
    variant="solid"
    class="nextStepButton mt-1 flex justify-center py-3 shadow-lg cursor-pointer w-full"
    @click="() => emit('doorReady')"
  >
    Fertig
  </UButton>
</template>
<script setup>
const props = defineProps({
  accessPointLabel: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(["doorReady"]);
</script>
<style scoped>
.nextStepButton {
  background: linear-gradient(
    180deg,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 85%, black)
  );
}
</style>
