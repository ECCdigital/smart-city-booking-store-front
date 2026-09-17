<template>
  <!--
    One line about the door's Access Window, in the slot the mode badge freed:
    "Zugang ab …" before it, "Zugang möglich bis …" during it, "Zugang endete
    um …" after it. The time alone on the day it happens, the date on any
    other; the full "von … bis …" form stands in the title. Which of the three
    it is follows the page's clock, so the line flips at the boundary without
    a reload. A door without window fields renders nothing.
  -->
  <p v-if="line" :title="fullForm">
    {{ t(`mobileKey.accessPoint.window.${line.state}`, params) }}
  </p>
</template>

<script setup>
import { useAccessNow } from "~/composables/useAccessClock.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { accessWindowLine } from "~/utils/accessPointDisplay.js";
import { doorWindow } from "~/utils/accessWindow.js";

const props = defineProps({
  /** With `accessFrom` / `accessTo` as backend 4.3 projects them. */
  accessPoint: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();
const { formatDate, formatTime } = useFormatting();
const now = useAccessNow();

const line = computed(() => accessWindowLine(props.accessPoint, now.value));

/** The moment as the line states it: time only today, with the date otherwise. */
const moment = computed(() => {
  if (!line.value) {
    return "";
  }

  return line.value.withDate
    ? formatDate(line.value.at)
    : formatTime(line.value.at);
});

/** `before` names the start, the other two the end - the keys say which. */
const params = computed(() =>
  line.value?.state === "before"
    ? { from: moment.value }
    : { to: moment.value },
);

const fullForm = computed(() => {
  const window = doorWindow(props.accessPoint);

  return window
    ? t("mobileKey.accessPoint.window.full", {
        from: formatDate(window.from),
        to: formatDate(window.to),
      })
    : "";
});
</script>
