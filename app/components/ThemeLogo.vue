<script setup>
import { imageClasses, imageStyle } from "~/components/hero/heroClasses";
import { useMediaImage } from "~/composables/utils/useMediaImage";

/**
 * The one image element of the Theme: the Hero's image Blocks — the logo of
 * the Default Hero Layout among them — and the logo above the auth forms
 * render through it, so a logo looks and loads the same wherever it shows.
 *
 * It resolves the reference through the media proxy at the `logo` preset,
 * carries the medium's own dimensions so the box is reserved before the
 * image arrives, loads eagerly with asynchronous decoding, and inverts in
 * dark mode only when asked. No preload hint: the element is in the
 * server-rendered HTML, which is where the preload scanner finds it. The
 * first image the page shows may ask for a high fetch priority.
 */
const props = defineProps({
  /** A media reference from the Theme View, with its dimensions when measured. */
  image: { type: Object, required: true },
  alt: { type: String, default: "" },
  /** The height step of the contract's image scale. */
  maxHeight: { type: String, default: "md" },
  invertInDarkMode: { type: Boolean, default: false },
  /** Whether this is the image the page fetches first. */
  priority: { type: Boolean, default: false },
});

const { imageSource } = useMediaImage();

/**
 * Everything that varies is one attribute object: the proxied source, the
 * inline height of a measured image — spread rather than bound as `:style`,
 * because the server renderer writes an empty `style=""` for a bound
 * `undefined` — and the fetch priority only when it is high. `null` when the
 * reference carries no address; then nothing renders.
 */
const attrs = computed(() => {
  const source = imageSource(props.image, "logo");
  if (!source) return null;

  const style = imageStyle(props);
  return {
    ...source,
    ...(style ? { style } : {}),
    ...(props.priority ? { fetchpriority: "high" } : {}),
  };
});

const classes = computed(() => imageClasses(props));
</script>

<template>
  <img
    v-if="attrs"
    v-bind="attrs"
    :width="image.width"
    :height="image.height"
    :alt="alt"
    loading="eager"
    decoding="async"
    :class="classes"
  >
</template>
