<script setup>
/**
 * PROTOTYPE #513: ersetzt den Hintergrund der Auth-Seiten durch ein
 * synthetisches Bild oder einen generierten Hintergrund. Das Bild bekommt wie
 * ein echtes Bild-Hintergrund ein Overlay im Dunkelmodus. Wegwerfen.
 */
import { protoBackground } from "~/composables/useLoginPrototype";

const proto = useLoginPrototype();
const src = computed(() => protoBackground(proto.bg.value));
const mesh = {
  version: 1,
  type: "variant",
  variant: "mesh",
  orbs: true,
  noise: true,
  intensity: "normal",
};
</script>

<template>
  <BackgroundLayers v-if="proto.bg.value === 'generiert'" :background="mesh" />
  <div v-else-if="src" class="absolute inset-0 overflow-hidden" aria-hidden="true">
    <img :src="src" alt="" class="absolute inset-0 w-full h-full object-cover">
    <div
      class="absolute inset-0 hidden dark:block bg-gray-900"
      :style="{ opacity: proto.overlay.value / 100 }"
    />
  </div>
</template>
