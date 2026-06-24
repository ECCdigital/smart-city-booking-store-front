<template>
  <div class="px-2 pb-[50px]">
    <DetailsAreaImages :item="item" :is-event="props.isEvent" />
    <div
      class="my-5 flex w-full items-center"
      :class="!cameFromMap ? 'justify-between' : 'justify-end'"
    >
      <BackButton v-if="!cameFromMap" />
      <UDropdownMenu :items="dropdownItems">
        <UButton
          icon="i-lucide-ellipsis-vertical"
          size="lg"
          aria-label="Aktionen"
          :style="{ color: contrastToPrimary, cursor: 'pointer' }"
        />
      </UDropdownMenu>
    </div>

    <DetailsAreaBookableContent v-if="!isEvent" :item="props.item" />
    <DetailsAreaEventContent v-else :item="props.item" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import DetailsAreaBookableContent from "~/components/search/DetailsAreaBookableContent.vue";
import DetailsAreaImages from "~/components/search/DetailsAreaImages.vue";
import DetailsAreaEventContent from "~/components/search/DetailsAreaEventContent.vue";
import { useIcalDownload } from "~/composables/api/useIcalDownload.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const cameFromMap = computed(() => {
  return route.query.view === "map";
});

const { contrastToPrimary } = useContrastColor();
const { downloadEventIcal } = useIcalDownload();
const notification = useNotification();

async function share() {
  await navigator.clipboard.writeText(window.location.href);
  notification.success(
    "Der Link zur aktuellen Suche wurde in Ihre Zwischenablage kopiert.",
    "Link erfolgreich kopiert!",
  );
}

async function downloadAppointment() {
  await downloadEventIcal(props.item.id, props.item.tenantId);
}

const dropdownItems = computed(() => {
  const items = [
    {
      label: "Teilen",
      icon: "i-lucide-share-2",
      onSelect: share,
    },
  ];

  if (props.isEvent) {
    items.unshift({
      label: "Termin herunterladen",
      icon: "i-lucide-calendar-arrow-down",
      onSelect: downloadAppointment,
    });
  }

  return items;
});
</script>
