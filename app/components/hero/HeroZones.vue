<script setup>
import { HERO_ANCHOR_CLASSES, HERO_COLUMN_ALIGN_CLASSES } from "./heroClasses";
import { blocksInZone, firstImageBlockId, zoneColumn } from "~/utils/heroBlocks";
import { HERO_ZONES } from "~~/shared/types/hero";

/**
 * The desktop tree: nine absolute anchor boxes inside the content area.
 * Blocks in a Zone stack vertically in array order, aligned to the Zone's
 * column; Blocks from different Zones may overlap — that is an editor
 * warning, never a renderer constraint.
 *
 * The tree and its anchors let pointer events through — a later Zone's box
 * never shadows a link in an earlier one, and the Live Preview's Zone
 * overlay beneath receives what the Blocks leave; the Blocks take the
 * events back.
 *
 * The first image Block of this tree fetches at high priority; no Block
 * gets a preload hint.
 */
const props = defineProps({
  blocks: { type: Array, required: true },
  mode: { type: String, required: true },
});

const priorityBlockId = computed(() => firstImageBlockId(props.blocks));

const zones = computed(() =>
  HERO_ZONES.map((zone) => ({
    zone,
    blocks: blocksInZone(props.blocks, zone),
  })).filter(({ blocks }) => blocks.length > 0),
);
</script>

<template>
  <div class="pointer-events-none relative h-full">
    <div
      v-for="{ zone, blocks: zoneBlocks } in zones"
      :key="zone"
      class="absolute flex flex-col pointer-events-none"
      :class="[
        HERO_ANCHOR_CLASSES[zone],
        HERO_COLUMN_ALIGN_CLASSES[zoneColumn(zone)],
      ]"
    >
      <HeroBlock
        v-for="block in zoneBlocks"
        :key="block.id"
        :block="block"
        :mode="mode"
        :priority="block.id === priorityBlockId"
      />
    </div>
  </div>
</template>
