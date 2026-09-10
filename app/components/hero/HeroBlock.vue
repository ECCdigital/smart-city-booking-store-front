<script setup>
import {
  blockBoxClasses,
  blockColorStyle,
  blockPanelStyle,
  imageBlockClasses,
  richtextBlockClasses,
  textBlockClasses,
} from "./heroClasses";
import { localizedText } from "~/utils/heroBlocks";

/**
 * One Block of the Hero Layout: its box — spacing, width, the surface of its
 * Panel — and its content. The same element serves the desktop Zones and the
 * mobile rows; only what is around it differs. It always carries its Block id and Zone
 * as data attributes, which is what the Live Preview measures against.
 *
 * `align` places that content inside the box, and it takes two forms because
 * an image is not a line of copy: the box carries the alignment its text
 * inherits, and the image element carries the margins that place it, which
 * is the whole of the difference (`imageBlockClasses`). Neither is emitted
 * for `align: "auto"` — a Block nobody aligned follows whatever the tree
 * around it declares, as it did before the field existed.
 *
 * Text and rich-text Blocks render here; image Blocks render through the one
 * logo element. Rich text goes into the page through `v-html`: the markup
 * comes from the Theme View, where the BFF has already run it through the
 * frozen allowlist (`server/utils/heroRichtext.ts`) — or, on the Live
 * Preview alone, from a Draft the bridge sanitised in the browser against
 * the same allowlist. Nothing unsanitised reaches this component.
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

// An inline style is spread rather than bound as `:style`, because the server
// renderer writes an empty `style=""` for a bound `undefined`; without the
// key it writes nothing.
function spread(style) {
  return style ? { style } : undefined;
}

// The copy's hex colour, when it has one instead of a named token.
const colorStyle = computed(() => {
  const colored = text.value ?? richtext.value;
  return spread(colored ? blockColorStyle(colored) : undefined);
});

// The Panel's fill. Its radius and blur are classes; only the colour at its
// opacity has to be a runtime value.
const panelStyle = computed(() => spread(blockPanelStyle(props.block)));
</script>

<template>
  <div
    v-if="text || richtext || image"
    :data-block="block.id"
    :data-zone="block.zone"
    class="pointer-events-auto"
    :class="blockBoxClasses(block)"
    v-bind="panelStyle"
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
      :class="imageBlockClasses(image)"
    />
  </div>
</template>
