<script setup>
import { HERO_ROW_JUSTIFY_CLASSES } from "./heroClasses";
import { mobileRows } from "~/utils/heroBlocks";

/**
 * The mobile tree: the Blocks grouped by the row of their Zone — top at the
 * top, middle centred in the remaining space, bottom at the bottom — in
 * array order inside a row and all horizontally centred, whatever their
 * Zone's column. Blocks marked hide-on-mobile are not here at all.
 */
const props = defineProps({
  blocks: { type: Array, required: true },
  mode: { type: String, required: true },
});

const rows = computed(() => mobileRows(props.blocks));
</script>

<template>
  <div class="grid h-full grid-rows-[auto_1fr_auto]">
    <div
      v-for="{ row, blocks: rowBlocks } in rows"
      :key="row"
      class="flex min-h-0 flex-col items-center text-center"
      :class="HERO_ROW_JUSTIFY_CLASSES[row]"
    >
      <HeroBlock
        v-for="block in rowBlocks"
        :key="block.id"
        :block="block"
        :mode="mode"
      />
    </div>
  </div>
</template>
