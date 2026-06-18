<template>
  <div class="relative flex items-center justify-center mb-12">
    <div
      class="absolute w-28 h-28 rounded-full bg-primary/30 animate-ping [animation-duration:2.5s]"
    />
    <div class="absolute w-38 h-38 rounded-full bg-white" />
    <div
      class="openButton rounded-full flex flex-col items-center justify-center shadow-lg"
      @click="onOpen"
    >
      <UIcon name="i-lucide-unlock" class="!text-[20px] text-white" />
      <span class="text-sm font-medium text-white mt-2">Öffnen</span>
    </div>
  </div>
</template>
<script setup>
const emit = defineEmits(["open"]);

function onOpen() {
  emit("open");
}
</script>
<style scoped>
.openButton {
  position: relative;
  width: 120px;
  height: 120px;
  z-index: 10;
  cursor: pointer;
  background: linear-gradient(
    180deg,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 85%, black)
  );
}
</style>
