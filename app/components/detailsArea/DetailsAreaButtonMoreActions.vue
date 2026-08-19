<template>
  <UDropdownMenu
    :items="moreActionOptions"
    :content="{ align: 'end' }"
    :ui="{ item: 'items-center' }"
  >
    <UButton
      icon="i-lucide-ellipsis-vertical"
      aria-label="Aktionen"
      size="xl"
      class="justify-center px-3"
      :style="{ color: contrastToPrimary, cursor: 'pointer' }"
    />
  </UDropdownMenu>
</template>
<script setup>
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";
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

const {
  contrastToPrimary,

  goToRelatedItems,
} = useBookableDetailContent(() => props.item, props.isEvent);
const { downloadEventIcal } = useIcalDownload();

const notification = useNotification();

const moreActionOptions = computed(() => {
  const items = [
    {
      label: "Teilen",
      icon: "i-lucide-share-2",
      onSelect: share,
    },
  ];
  if (props.item.relatedBookables?.length) {
    items.push({
      label: "Buchungsoptionen ansehen",
      icon: "i-lucide-list",
      onSelect: goToRelatedItems,
    });
  }

  if (props.isEvent) {
    items.push({
      label: "Termin herunterladen",
      icon: "i-lucide-calendar-arrow-down",
      onSelect: downloadAppointment,
    });
  }

  return items;
});

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
</script>

<style scoped></style>
