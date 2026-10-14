<script setup>
import { mergeProps } from "vue";
import { themeLogoImages } from "~/utils/themeLogo";

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
 *
 * Given a variant for the dark mode, it renders both images and the class
 * `.dark` shows one; see `themeLogoImages`. The classes and attributes given
 * from outside go to every image, which is why they are not inherited by a
 * root element.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** A media reference from the Theme View, with its dimensions when measured. */
  image: { type: Object, required: true },
  /** The variant of the image the dark mode shows in its place, if any. */
  imageDark: { type: Object, default: null },
  alt: { type: String, default: "" },
  /** The height step of the contract's image scale. */
  maxHeight: { type: String, default: "md" },
  /** Inverts the image in the dark mode when there is no variant. */
  invertInDarkMode: { type: Boolean, default: false },
  /** Whether this is the image the page fetches first. */
  priority: { type: Boolean, default: false },
});

const images = computed(() => themeLogoImages(props));
</script>

<template>
  <img
    v-for="(attrs, index) in images"
    :key="index"
    v-bind="mergeProps(attrs, $attrs)"
    :alt="alt"
    loading="eager"
    decoding="async"
  >
</template>
