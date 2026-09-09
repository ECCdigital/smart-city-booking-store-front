<script setup>
import { HERO_ROW_JUSTIFY_CLASSES } from "./heroClasses";
import { firstImageBlockId, mobileRows } from "~/utils/heroBlocks";

/**
 * The mobile tree: the Blocks grouped by the row of their Zone — top at the
 * top, middle centred in the remaining space, bottom at the bottom — in
 * array order inside a row and all horizontally centred, whatever their
 * Zone's column. Blocks marked hide-on-mobile are not here at all. Like
 * the desktop tree it lets pointer events through and the Blocks take them
 * back, so the Live Preview's Zone overlay beneath is reachable.
 *
 * The first image Block this tree shows fetches at high priority — its
 * own first, since the desktop tree's may be hidden here; no Block gets a
 * preload hint.
 *
 * The one column is `minmax(0, 1fr)` rather than the implicit `auto`: an
 * auto track grows to the widest Block's fixed width, and a Block's
 * `max-w-full` then resolves against that track instead of the content
 * area, so a 32 rem Block would overflow a phone.
 */
const props = defineProps({
  blocks: { type: Array, required: true },
  mode: { type: String, required: true },
});

const rows = computed(() => mobileRows(props.blocks));
const priorityBlockId = computed(() =>
  firstImageBlockId(rows.value.flatMap((row) => row.blocks)),
);
</script>

<template>
  <div class="pointer-events-none grid h-full grid-cols-1 grid-rows-[auto_1fr_auto]">
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
        :priority="block.id === priorityBlockId"
      />
    </div>
  </div>
</template>
