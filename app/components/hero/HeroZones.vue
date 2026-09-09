<script setup>
import { HERO_ANCHOR_CLASSES, HERO_COLUMN_ALIGN_CLASSES } from "./heroClasses";
import { blocksInZone, zoneColumn } from "~/utils/heroBlocks";
import { HERO_ZONES } from "~~/shared/types/hero";

/**
 * The desktop tree: nine absolute anchor boxes inside the content area.
 * Blocks in a Zone stack vertically in array order, aligned to the Zone's
 * column; Blocks from different Zones may overlap — that is an editor
 * warning, never a renderer constraint.
 *
 * The anchors span the full content width and let pointer events through,
 * so a later Zone's box never shadows a link in an earlier one; the Blocks
 * take the events back.
 */
const props = defineProps({
  blocks: { type: Array, required: true },
  mode: { type: String, required: true },
});

const zones = computed(() =>
  HERO_ZONES.map((zone) => ({
    zone,
    blocks: blocksInZone(props.blocks, zone),
  })).filter(({ blocks }) => blocks.length > 0),
);
</script>

<template>
  <div class="relative h-full">
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
      />
    </div>
  </div>
</template>
