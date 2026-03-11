<template>
  <div class="px-2 pb-[50px]">
    <!-- toDo - weitere Bilder einfügen *** -->
    <DetailsAreaImages :item="item" :is-event="props.isEvent" />

    <div class="w-full flex justify-between my-5">
      <BackButton />
      <div class="space-x-1">
        <UButton
          v-if="isEvent"
          label="Termin herunterladen"
          icon="i-lucide-calendar-arrow-down"
          class="justify-center px-5"
          :style="{ color: contrastToPrimary, cursor: 'pointer' }"
          @click="downloadAppointment()"
        />
        <UButton
          label="Teilen"
          icon="i-lucide-share-2"
          class="justify-center px-5"
          :style="{ color: contrastToPrimary, cursor: 'pointer' }"
          @click="share()"
        />
      </div>
    </div>

    <DetailsAreaBookableContent v-if="!isEvent" :item="props.item" />
    <DetailsAreaEventContent v-else :item="props.item" />
  </div>
</template>
<script setup>
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
</script>
<style scoped></style>
