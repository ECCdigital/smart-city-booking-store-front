<template>
  <UDropdownMenu
    :items="moreActionOptions"
    :content="{ align: 'end' }"
    :ui="{ item: 'items-center' }"
  >
    <UButton
      icon="i-lucide-ellipsis-vertical"
      :aria-label="$t('common.actions')"
      size="xl"
      class="justify-center px-3"
      :style="{ color: contrastToPrimary, cursor: 'pointer' }"
    />
  </UDropdownMenu>
</template>
<script setup>
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";
import { useIcalDownload } from "~/composables/api/useIcalDownload.js";


const { t } = useI18n();

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
      label: t("bookableDetail.share"),
      icon: "i-lucide-share-2",
      onSelect: share,
    },
  ];
  if (props.item.relatedBookables?.length) {
    items.push({
      label: t("bookableDetail.viewBookingOptions"),
      icon: "i-lucide-list",
      onSelect: goToRelatedItems,
    });
  }

  if (props.isEvent) {
    items.push({
      label: t("booking.downloadAppointment"),
      icon: "i-lucide-calendar-arrow-down",
      onSelect: downloadAppointment,
    });
  }

  return items;
});

async function share() {
  await navigator.clipboard.writeText(window.location.href);
  notification.success(
    t("bookableDetail.linkCopiedMessage"),
    t("bookableDetail.linkCopiedTitle"),
  );
}

async function downloadAppointment() {
  await downloadEventIcal(props.item.id, props.item.tenantId);
}
</script>

<style scoped></style>
