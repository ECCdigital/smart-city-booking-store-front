<template>
  <!--
    Date and time, format and, without registration, the participation link
    of an event (ECCdigital/tickets#456). With registration only the bookers
    see the link, in their account.
  -->
  <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3 space-y-2">
    <EventTimeInformation :event="item" />
    <div class="flex">
      <div class="grid place-content-center shrink-0">
        <UIcon name="i-lucide-monitor-smartphone" class="size-5" />
      </div>
      <div class="px-3 min-w-0">
        {{ $t("events.format.label") }}: {{ $t(eventFormatLabelKey(item)) }}
      </div>
    </div>
    <div v-if="participationLink" class="flex">
      <div class="grid place-content-center shrink-0">
        <UIcon name="i-lucide-video" class="size-5" />
      </div>
      <div class="px-3 min-w-0 break-all">
        {{ $t("events.participationLink") }}:
        <a
          :href="participationLink"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline"
          >{{ participationLink }}</a
        >
      </div>
    </div>
  </div>
</template>
<script setup>
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import {
  eventFormatLabelKey,
  publicParticipationLinkOf,
} from "~/utils/eventFormat.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const participationLink = computed(() => publicParticipationLinkOf(props.item));
</script>
<style scoped></style>
