<script setup>
/**
 * PROTOTYPE #513: das Logo über dem Login, echt (ThemeLogo) oder synthetisch,
 * in der gewählten Größenstufe. Wegwerfen.
 */
import { imageClasses, imageStyle } from "~/components/hero/heroClasses";
import { protoLogo } from "~/composables/useLoginPrototype";

const props = defineProps({
  /** Das echte Logo der Instanz aus dem Theme View. */
  instanceLogo: { type: Object, default: null },
  alt: { type: String, default: "" },
  maxHeight: { type: String, default: "sm" },
});

const proto = useLoginPrototype();

const synthetic = computed(() => protoLogo(proto.logo.value));
const image = computed(() =>
  proto.logo.value === "instanz" ? props.instanceLogo : synthetic.value,
);
const options = computed(() => ({
  image: image.value ?? {},
  maxHeight: props.maxHeight,
  invertInDarkMode: proto.invert.value,
}));

</script>

<template>
  <template v-if="proto.logo.value !== 'keins' && image">
    <ThemeLogo
      v-if="proto.logo.value === 'instanz'"
      :image="image"
      :alt="alt"
      :max-height="maxHeight"
      :invert-in-dark-mode="proto.invert.value"
    />
    <img
      v-else
      :src="image.url"
      :width="image.width"
      :height="image.height"
      :alt="alt"
      :class="imageClasses(options)"
      :style="imageStyle(options)"
    >
  </template>
</template>
