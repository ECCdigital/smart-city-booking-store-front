<script setup>
import {
  blockBoxClasses,
  textBlockClasses,
  textBlockStyle,
} from "./heroClasses";
import { localizedText } from "~/utils/heroBlocks";

/**
 * One Block of the Hero Layout: its box — spacing, width, panel — and its
 * content. The same element serves the desktop Zones and the mobile rows;
 * only what is around it differs. It always carries its Block id and Zone
 * as data attributes, which is what the Live Preview measures against.
 *
 * Text Blocks render here. Rich-text and image Blocks are later tickets and
 * render nothing yet.
 */
const props = defineProps({
  block: { type: Object, required: true },
  /** The Compact Hero renders every text size one step down. */
  mode: { type: String, required: true },
});

const { locale } = useI18n();

const text = computed(() =>
  props.block.type === "text" ? props.block : null,
);

// Spread rather than bound as `:style`, because the server renderer writes
// an empty `style=""` for a bound `undefined`; without the key it writes nothing.
const textStyle = computed(() => {
  const style = text.value && textBlockStyle(text.value);
  return style ? { style } : undefined;
});
</script>

<template>
  <div
    v-if="text"
    :data-block="block.id"
    :data-zone="block.zone"
    class="pointer-events-auto"
    :class="blockBoxClasses(block)"
  >
    <p :class="textBlockClasses(text, mode)" v-bind="textStyle">
      {{ localizedText(text.text, locale) }}
    </p>
  </div>
</template>
