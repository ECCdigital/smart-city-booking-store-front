<script setup>
import {
  blockBoxClasses,
  blockColorStyle,
  richtextBlockClasses,
  textBlockClasses,
} from "./heroClasses";
import { localizedText } from "~/utils/heroBlocks";

/**
 * One Block of the Hero Layout: its box — spacing, width, panel — and its
 * content. The same element serves the desktop Zones and the mobile rows;
 * only what is around it differs. It always carries its Block id and Zone
 * as data attributes, which is what the Live Preview measures against.
 *
 * Text and rich-text Blocks render here; image Blocks render through the one
 * logo element. Rich text goes into the page through `v-html`: the markup
 * comes from the Theme View, where the BFF has already run it through the
 * frozen allowlist (`server/utils/heroRichtext.ts`), and the client never
 * sanitises or receives anything that has not been sanitised.
 */
const props = defineProps({
  block: { type: Object, required: true },
  /** The Compact Hero renders every text size one step down. */
  mode: { type: String, required: true },
  /** Whether this is the image Block the Hero fetches first. */
  priority: { type: Boolean, default: false },
});

const { locale } = useI18n();

const text = computed(() =>
  props.block.type === "text" ? props.block : null,
);
const richtext = computed(() =>
  props.block.type === "richtext" ? props.block : null,
);
// A reference without an address has nothing to show; no empty box for it.
const image = computed(() =>
  props.block.type === "image" && props.block.image.url ? props.block : null,
);

// Spread rather than bound as `:style`, because the server renderer writes
// an empty `style=""` for a bound `undefined`; without the key it writes nothing.
const colorStyle = computed(() => {
  const colored = text.value ?? richtext.value;
  const style = colored && blockColorStyle(colored);
  return style ? { style } : undefined;
});
</script>

<template>
  <div
    v-if="text || richtext || image"
    :data-block="block.id"
    :data-zone="block.zone"
    class="pointer-events-auto"
    :class="blockBoxClasses(block)"
  >
    <p v-if="text" :class="textBlockClasses(text, mode)" v-bind="colorStyle">
      {{ localizedText(text.text, locale) }}
    </p>
    <!-- eslint-disable vue/no-v-html -- server-sanitised markup, see the component comment -->
    <div
      v-else-if="richtext"
      :class="richtextBlockClasses(richtext, mode)"
      v-bind="colorStyle"
      v-html="localizedText(richtext.html, locale)"
    />
    <!-- eslint-enable vue/no-v-html -->
    <ThemeLogo
      v-else-if="image"
      :image="image.image"
      :alt="localizedText(image.alt, locale)"
      :max-height="image.maxHeight"
      :invert-in-dark-mode="image.invertInDarkMode"
      :priority="priority"
    />
  </div>
</template>
