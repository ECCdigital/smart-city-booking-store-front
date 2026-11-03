<script setup>
import { useMediaImage } from "~/composables/utils/useMediaImage";
import { imagesByColourMode } from "~/utils/themeLogo";

/**
 * The instance's footer logos, funding logos among them, as one wrapping
 * list. The caller places the list; each logo is sized here.
 *
 * Every logo has the height of its step, 48, 80 or 120 px and × 0.8 below
 * `sm`, and follows its aspect ratio up to 3.5 times that height, contained.
 * In dark mode a logo with a variant swaps to it, by the rule of the app logo
 * (`imagesByColourMode`); one without stands on a white plate. A logo is
 * never inverted: a funding logo must keep its colours. Both images of a
 * variant are in the server-rendered HTML and the class `.dark` picks one, so
 * the first paint is right in either mode; lazy loading leaves the hidden one
 * unfetched.
 */
const props = defineProps({
  /** The `footerLogos` of the Theme View, in order. */
  logos: { type: Array, required: true },
});

/** Height and widest box per step, on the phone and from `sm` on. */
const SIZE_CLASSES = {
  sm: "h-[38.4px] max-w-[134.4px] sm:h-[48px] sm:max-w-[168px]",
  md: "h-[64px] max-w-[224px] sm:h-[80px] sm:max-w-[280px]",
  lg: "h-[96px] max-w-[336px] sm:h-[120px] sm:max-w-[420px]",
};

const { imageSource } = useMediaImage();

/** Each logo with the attributes of its images; both carry the logo's name. */
const items = computed(() =>
  props.logos.map((logo) => {
    const images = imagesByColourMode(logo.image, logo.imageDark).map(
      ({ image, modeClasses }) => ({
        ...imageSource(image, "logo"),
        width: image.width,
        height: image.height,
        alt: logo.image.name,
        class: ["w-auto object-contain", SIZE_CLASSES[logo.size], ...modeClasses],
      }),
    );
    return { logo, images, plate: images.length === 1 };
  }),
);
</script>

<template>
  <ul class="flex flex-wrap items-center gap-x-8 gap-y-4">
    <li
      v-for="({ logo, images, plate }, index) in items"
      :key="`${index}:${logo.image.mediaId}`"
      class="flex"
    >
      <component
        :is="logo.link ? 'a' : 'span'"
        v-bind="
          logo.link
            ? { href: logo.link, target: '_blank', rel: 'noopener' }
            : {}
        "
        class="inline-flex rounded-md"
        :class="[
          logo.link &&
            'transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          plate && 'dark:bg-white dark:p-1.5',
        ]"
      >
        <img
          v-for="(attrs, imageIndex) in images"
          :key="imageIndex"
          v-bind="attrs"
          loading="lazy"
          decoding="async"
        >
      </component>
    </li>
  </ul>
</template>
